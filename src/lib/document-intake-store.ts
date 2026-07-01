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

      let bytes: Buffer;
      try {
        bytes = await readFile(absPath);
      } catch (error) {
        // Vanished between stat and read; treat only ENOENT as skippable.
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }
      candidates.push({
        absPath,
        filename: entry.name,
        source,
        mimeType: guessMimeType(entry.name),
        byteSize: bytes.byteLength,
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

/** Removes a duplicate inbox original without storing it again. */
export async function discardInboxFile(absPath: string): Promise<void> {
  await rm(absPath, { force: true });
}

/** Writes an uploaded file into the content-addressed store. */
export async function storeUploadedFile(filename: string, bytes: Buffer): Promise<StoredFile> {
  await ensureIntakeDirs();
  const root = intakeRoot();
  const contentHash = hashContent(bytes);
  const storedName = `${contentHash}${extname(filename).toLowerCase()}`;
  const storedPath = join(root, STORE, storedName);
  await writeFile(storedPath, bytes);
  return { storedPath, filename, contentHash, mimeType: guessMimeType(filename), byteSize: bytes.byteLength };
}

/** Moves a stored file into the archive folder, returning the new path (or the
 * original path if the source no longer exists). */
export async function moveToArchive(storedPath: string): Promise<string> {
  const root = intakeRoot();
  const name = basename(storedPath) || `archived-${Date.now()}`;
  const target = join(root, ARCHIVE, name);
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
