import "server-only";

import { execFile } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Local OCR/text extraction for captured documents.
//
// Reading happens entirely on the box: digital PDFs go through poppler's
// `pdftotext`; scanned PDFs and images go through Tesseract OCR (with poppler's
// `pdftoppm` rasterising PDF pages first). No bytes ever leave the machine.
//
// Every path degrades gracefully: if a binary is missing or a document cannot
// be read, this returns empty text plus an error so the review queue can fall
// back to manual text entry instead of failing the whole pathway.

export type DocumentTextResult = {
  text: string;
  engine: string;
  error?: string;
  // True when the returned text is incomplete — a multi-page PDF only OCR'd up to
  // MAX_OCR_PAGES, or any text capped at MAX_TEXT_LENGTH — so a reviewer knows the
  // later part of the document was not read.
  truncated?: boolean;
};

const MAX_TEXT_LENGTH = 200_000;
const MAX_OCR_PAGES = 10;
const COMMAND_TIMEOUT_MS = 120_000;
// Document-level OCR budget across all rasterised pages, so a scan of pages that
// each hang up to COMMAND_TIMEOUT_MS cannot keep the request busy for ~20 minutes.
const MAX_OCR_TOTAL_MS = 5 * 60_000;
// Below this, a "digital" PDF text layer is treated as empty/scanned and we
// fall back to OCR.
const MIN_DIGITAL_TEXT_LENGTH = 24;

export function isPdf(mimeType: string | null | undefined, filename: string): boolean {
  if (mimeType?.includes("pdf")) return true;
  return /\.pdf$/i.test(filename);
}

export function isImage(mimeType: string | null | undefined, filename: string): boolean {
  if (mimeType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|tiff?|webp|bmp|gif)$/i.test(filename);
}

export async function extractDocumentText({
  storedPath,
  mimeType,
  filename
}: {
  storedPath: string;
  mimeType?: string | null;
  filename: string;
}): Promise<DocumentTextResult> {
  try {
    if (isPdf(mimeType, filename)) {
      return await readPdf(storedPath);
    }
    if (isImage(mimeType, filename)) {
      return await ocrImage(storedPath);
    }
    return { text: "", engine: "none", error: `Unsupported file type for reading: ${mimeType ?? filename}.` };
  } catch (error) {
    return { text: "", engine: "none", error: toMessage(error) };
  }
}

async function readPdf(storedPath: string): Promise<DocumentTextResult> {
  // First try the embedded text layer (fast, exact for digital PDFs).
  const digital = await runCommand("pdftotext", ["-layout", storedPath, "-"]).catch((error) => ({ ok: false as const, stdout: "", error: toMessage(error) }));
  if (digital.ok && clean(digital.stdout).length >= MIN_DIGITAL_TEXT_LENGTH) {
    return { text: capText(digital.stdout), engine: "pdftotext", truncated: digital.stdout.length > MAX_TEXT_LENGTH };
  }

  // Otherwise rasterise pages and OCR them (scanned PDF).
  const ocr = await ocrPdfViaRaster(storedPath);
  if (ocr.text.length > 0) return ocr;

  // Nothing usable was read: the digital text (if any) was already below
  // MIN_DIGITAL_TEXT_LENGTH and OCR produced nothing. Return empty text so the
  // caller marks the row FAILED rather than treating a stray page number/header
  // as a successful triage that hides a genuinely unreadable document.
  const error = ocr.error ?? (digital.ok ? "PDF had no usable text layer and OCR produced nothing." : digital.error);
  return { text: "", engine: "none", error };
}

async function ocrPdfViaRaster(storedPath: string): Promise<DocumentTextResult> {
  let workDir: string | undefined;
  try {
    workDir = await mkdtemp(join(tmpdir(), "intake-ocr-"));
    const prefix = join(workDir, "page");
    // Rasterise one extra "sentinel" page beyond the cap so we can tell a PDF that
    // is exactly MAX_OCR_PAGES long (not truncated) from one that is longer.
    await runCommand("pdftoppm", ["-png", "-r", "200", "-l", String(MAX_OCR_PAGES + 1), storedPath, prefix]);
    // Sort by the numeric page index (page-2 before page-10), not lexically, so
    // multi-page text reaches OCR/Ollama in reading order.
    const files = (await readdir(workDir))
      .filter((name) => name.endsWith(".png"))
      .sort((a, b) => pageNumber(a) - pageNumber(b));
    if (files.length === 0) return { text: "", engine: "none", error: "pdftoppm produced no page images." };

    // Only OCR up to the cap; the sentinel (if present) means further pages exist.
    let truncated = files.length > MAX_OCR_PAGES;
    const pages: string[] = [];
    const failedPages: number[] = [];
    // Bound total OCR wall-time. Each page has its own 120s command timeout, so a
    // full 10-page scan of hanging pages could otherwise tie up the request for
    // ~20 minutes. Once the deadline passes we stop before the next page (a legit
    // fast scan finishes well within it; a pathological one degrades to partial).
    const deadline = Date.now() + MAX_OCR_TOTAL_MS;
    let deadlineHit = false;
    for (const file of files.slice(0, MAX_OCR_PAGES)) {
      if (Date.now() > deadline) {
        deadlineHit = true;
        break;
      }
      try {
        const page = await ocrImage(join(workDir, file));
        if (page.text) pages.push(page.text);
        // A single dense page can hit the per-page cap and be sliced to exactly
        // MAX_TEXT_LENGTH; carry that truncation up (the joined-length check below
        // would miss it because the slice makes it equal, not greater).
        if (page.truncated) truncated = true;
      } catch {
        // Keep the pages that did read; one bad/timed-out page must not discard a
        // whole multi-page scan. The failed page is noted for the reviewer.
        failedPages.push(pageNumber(file));
      }
    }
    // Stopping early for either reason means later pages were not read.
    if (deadlineHit) truncated = true;
    if (pages.length === 0) {
      const error = deadlineHit
        ? "OCR stopped at the time limit before any page could be read."
        : failedPages.length > 0
          ? `OCR failed on every page (e.g. page ${failedPages[0]}).`
          : "OCR produced no text.";
      return { text: "", engine: "none", error, truncated };
    }
    const errorNotes = [
      failedPages.length > 0 ? `OCR failed on page(s) ${failedPages.join(", ")}; text from those pages is missing.` : null,
      deadlineHit ? "OCR stopped at the time limit; later pages were not read." : null
    ].filter(Boolean);
    const error = errorNotes.length > 0 ? errorNotes.join(" ") : undefined;
    const joined = pages.join("\n\n");
    // Flag truncation for either reason: more pages than the OCR cap, or dense
    // pages whose combined text exceeds the character cap and gets sliced away.
    return { text: capText(joined), engine: "tesseract+pdftoppm", truncated: truncated || joined.length > MAX_TEXT_LENGTH, error };
  } catch (error) {
    return { text: "", engine: "none", error: toMessage(error) };
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function ocrImage(imagePath: string): Promise<DocumentTextResult> {
  // `tesseract <img> stdout` writes recognised text to stdout.
  const result = await runCommand("tesseract", [imagePath, "stdout"]);
  // Flag truncation so a dense image / multipage TIFF whose OCR exceeds the cap
  // warns the reviewer, matching the PDF paths. (When called per-page by the PDF
  // rasteriser, this flag is ignored in favour of that path's own accounting.)
  return { text: capText(result.stdout), engine: "tesseract", truncated: result.stdout.length > MAX_TEXT_LENGTH };
}

function runCommand(command: string, args: string[]): Promise<{ ok: true; stdout: string }> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: COMMAND_TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024, encoding: "utf8" }, (error, stdout) => {
      if (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {
          reject(new Error(`Required binary "${command}" is not installed. OCR is unavailable; enter document text manually.`));
          return;
        }
        reject(new Error(`${command} failed: ${error.message}`));
        return;
      }
      resolve({ ok: true, stdout: typeof stdout === "string" ? stdout : String(stdout) });
    });
  });
}

function pageNumber(name: string): number {
  const match = name.match(/(\d+)\.png$/);
  return match ? Number(match[1]) : 0;
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function capText(text: string): string {
  return text.slice(0, MAX_TEXT_LENGTH);
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Document read failed.";
}
