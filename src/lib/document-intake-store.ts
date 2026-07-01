import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

// Filesystem side of the document intake pathway.
//
// Layout under INTAKE_DIR (a Docker volume in production, ./.intake in dev):
//   inbox/scan/   watched drop folder for a scanner or phone sync  -> source FOLDER
//   inbox/email/  documents synced in from the email/Drive pipeline -> source EMAIL
//   store/        content-addressed permanent copies (sha256 + ext)
//   archive/      copies moved out when a document is archived
//
// This module only moves bytes around the box. Deduplication and record
// creation live in services.ts (which knows the database); nothing here
// contacts an external service.

export type IntakeSource = "FOLDER" | "UPLOAD" | "EMAIL";

export type InboxCandidate = {
  absPath: string;
  filename: string;
  source: IntakeSource;
  mimeType: string;
  byteSize: number;
  // The file's modified time at collect. Carried so discardInboxFile can confirm
  // the path still holds the same file before deleting it (see below).
  mtimeMs: number;
  contentHash: string;
  // The already-read bytes, carried so the commit step does not re-read the file.
  bytes: Buffer;
};

export type StoredFile = {
  storedPath: string;
  filename: string;
  contentHash: string;
  mimeType: string;
  byteSize: number;
};

const INBOX_SCAN = join("inbox", "scan");
const INBOX_EMAIL = join("inbox", "email");
const STORE = "store";
const ARCHIVE = "archive";
// Watched-folder files above this size are skipped (not read into memory),
// consistent with the in-cockpit upload limit.
const MAX_INBOX_FILE_BYTES = 20 * 1024 * 1024;
// A single ingest run only pulls this many files, and this many total bytes,
// into memory at once. A large watched-folder backlog is drained across several
// runs rather than materialising hundreds of MB in one server action and risking
// an OOM/timeout. Files left behind stay in the inbox and are picked up next run.
const MAX_INBOX_BATCH_FILES = 50;
const MAX_INBOX_BATCH_BYTES = 128 * 1024 * 1024;

export function intakeRoot(): string {
  return process.env.INTAKE_DIR ?? join(process.cwd(), ".intake");
}

export async function ensureIntakeDirs(): Promise<void> {
  const root = intakeRoot();
  await Promise.all([
    mkdir(join(root, INBOX_SCAN), { recursive: true }),
    mkdir(join(root, INBOX_EMAIL), { recursive: true }),
    mkdir(join(root, STORE), { recursive: true }),
    mkdir(join(root, ARCHIVE), { recursive: true })
  ]);
}

/**
 * Scans both inbox subfolders and returns a hashed candidate for every file
 * found, tagged with its source. Hidden files and the ".gitkeep" placeholder
 * are ignored. Candidates are not yet committed to the store.
 */
export async function collectInboxCandidates(): Promise<InboxCandidate[]> {
  await ensureIntakeDirs();
  const root = intakeRoot();
  const candidates: InboxCandidate[] = [];
  // Skip files whose mtime is within the settle window: a scanner/sync may still
  // be writing them, and reading now would capture a truncated document. They are
  // picked up on the next ingest. Set INTAKE_SETTLE_MS=0 to disable (used in tests).
  // A non-numeric value (operator typo) falls back to the default rather than
  // silently disabling the guard.
  const rawSettleMs = process.env.INTAKE_SETTLE_MS;
  const parsedSettleMs = rawSettleMs == null || rawSettleMs.trim() === "" ? NaN : Number(rawSettleMs);
  const settleMs = Number.isFinite(parsedSettleMs) ? parsedSettleMs : 3000;
  const now = Date.now();

  // Phase 1: enumerate eligible files per source (readdir + stat only; no bytes
  // are read yet). The settle-window, oversize, and dotfile rules are applied
  // here so the byte-reading phase only sees files worth ingesting.
  type EligibleFile = { absPath: string; filename: string; source: IntakeSource; size: number; mtimeMs: number };
  const perSource: EligibleFile[][] = [];
  for (const [dir, source] of [
    [INBOX_SCAN, "FOLDER"],
    [INBOX_EMAIL, "EMAIL"]
  ] as Array<[string, IntakeSource]>) {
    const absDir = join(root, dir);
    // A genuinely missing directory means "no candidates"; permission/I/O errors
    // must surface rather than be silently treated as an empty inbox.
    const entries = await readdir(absDir, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const eligible: EligibleFile[] = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (entry.name.startsWith(".")) continue;
      const absPath = join(absDir, entry.name);

      let info;
      try {
        info = await stat(absPath);
      } catch (error) {
        // Vanished between readdir and stat (moved/removed by the producer).
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }
      if (settleMs > 0 && now - info.mtimeMs < settleMs) continue;
      // Skip oversized files before reading them into memory (they stay in the
      // inbox for the operator to notice), consistent with the upload limit.
      if (info.size > MAX_INBOX_FILE_BYTES) continue;
      eligible.push({ absPath, filename: entry.name, source, size: info.size, mtimeMs: info.mtimeMs });
    }
    perSource.push(eligible);
  }

  // Phase 2: read bytes round-robin across the sources so a large scan backlog
  // never starves emailed documents (and vice versa). Stop at the per-run
  // file/byte caps; the byte cap always admits at least one file so a run can
  // never stall on a backlog. Files left behind stay in the inbox for next run.
  let batchBytes = 0;
  const deepest = Math.max(0, ...perSource.map((files) => files.length));
  roundRobin: for (let index = 0; index < deepest; index++) {
    for (const files of perSource) {
      const file = files[index];
      if (!file) continue;
      if (candidates.length >= MAX_INBOX_BATCH_FILES) break roundRobin;
      if (candidates.length > 0 && batchBytes + file.size > MAX_INBOX_BATCH_BYTES) break roundRobin;

      let bytes: Buffer;
      try {
        bytes = await readFile(file.absPath);
      } catch (error) {
        // Vanished between stat and read; treat only ENOENT as skippable.
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }
      batchBytes += bytes.byteLength;
      candidates.push({
        absPath: file.absPath,
        filename: file.filename,
        source: file.source,
        mimeType: guessMimeType(file.filename),
        byteSize: bytes.byteLength,
        mtimeMs: file.mtimeMs,
        contentHash: hashContent(bytes),
        bytes
      });
    }
  }

  return candidates;
}

/**
 * Copies an inbox candidate into the content-addressed store WITHOUT removing
 * the inbox original. The caller deletes the original (via discardInboxFile)
 * only after the database capture row exists, so a crash between copy and record
 * leaves the file in the watched folder for the next ingest rather than orphaned.
 */
export async function copyInboxCandidateToStore(candidate: InboxCandidate): Promise<StoredFile> {
  const root = intakeRoot();
  const storedName = `${candidate.contentHash}${extname(candidate.filename).toLowerCase()}`;
  const storedPath = join(root, STORE, storedName);
  // Reuse the bytes already read during scanning rather than reading the file again.
  await writeFile(storedPath, candidate.bytes);
  return {
    storedPath,
    filename: candidate.filename,
    contentHash: candidate.contentHash,
    mimeType: candidate.mimeType,
    byteSize: candidate.byteSize
  };
}

/**
 * Removes an inbox original once its bytes have been captured. Guards against a
 * producer (scanner/email sync) that reuses a stable filename: if a newer file
 * has replaced the one we read at this path, its size or mtime will differ, so
 * we leave it in place for the next ingest rather than deleting an unread
 * document. The stat+rm is not perfectly atomic, but the match check closes the
 * realistic filename-reuse window.
 */
export async function discardInboxFile(
  candidate: Pick<InboxCandidate, "absPath" | "byteSize" | "mtimeMs">
): Promise<void> {
  const info = await stat(candidate.absPath).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!info) return; // Already gone.
  if (info.size !== candidate.byteSize || info.mtimeMs !== candidate.mtimeMs) return; // Replaced since we read it.
  await rm(candidate.absPath, { force: true });
}

/** Writes an uploaded file into the content-addressed store. Prefers the
 * browser-provided MIME type (so extensionless mobile uploads keep their real
 * type) and falls back to guessing from the filename. */
export async function storeUploadedFile(filename: string, bytes: Buffer, mimeType?: string): Promise<StoredFile> {
  await ensureIntakeDirs();
  const root = intakeRoot();
  const contentHash = hashContent(bytes);
  const storedName = `${contentHash}${extname(filename).toLowerCase()}`;
  const storedPath = join(root, STORE, storedName);
  await writeFile(storedPath, bytes);
  const resolvedMime = mimeType && mimeType !== "application/octet-stream" ? mimeType : guessMimeType(filename);
  return { storedPath, filename, contentHash, mimeType: resolvedMime, byteSize: bytes.byteLength };
}

/** The deterministic archive destination for a stored file. Exposed so a caller
 * can record the target path atomically (in the same DB claim) before the bytes
 * are moved, avoiding a separate post-move write that could fail and desync the
 * stored path from the file location. */
export function archiveTargetPath(storedPath: string): string {
  return join(intakeRoot(), ARCHIVE, basename(storedPath) || "archived-file");
}

/** Moves a stored file into the archive folder, returning the new path (or the
 * original path if the source no longer exists). */
export async function moveToArchive(storedPath: string): Promise<string> {
  const target = archiveTargetPath(storedPath);
  const exists = await stat(storedPath).then(() => true).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
  if (!exists) {
    // Source already gone (e.g. a retry after a prior move succeeded): return the
    // archive target if it now holds the file, so the caller persists the correct
    // path rather than a stale store path.
    const archived = await stat(target).then(() => true).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return false;
      throw error;
    });
    return archived ? target : storedPath;
  }
  await rename(storedPath, target).catch(async () => {
    // rename can fail across devices; fall back to copy+delete.
    const bytes = await readFile(storedPath);
    await writeFile(target, bytes);
    await rm(storedPath);
  });
  return target;
}

export async function readStoredFile(storedPath: string): Promise<Buffer> {
  return readFile(storedPath);
}

export function hashContent(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

export function guessMimeType(filename: string): string {
  return MIME_BY_EXT[extname(filename).toLowerCase()] ?? "application/octet-stream";
}
