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
  // True when a multi-page PDF was only OCR'd up to MAX_OCR_PAGES, so a reviewer
  // knows later pages were not read.
  truncated?: boolean;
};

const MAX_TEXT_LENGTH = 200_000;
const MAX_OCR_PAGES = 10;
const COMMAND_TIMEOUT_MS = 120_000;
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
    return { text: capText(digital.stdout), engine: "pdftotext" };
  }

  // Otherwise rasterise pages and OCR them (scanned PDF).
  const ocr = await ocrPdfViaRaster(storedPath);
  if (ocr.text.length > 0) return ocr;

  // Nothing worked: surface the most useful error.
  const error = ocr.error ?? (digital.ok ? "PDF had no extractable text layer and OCR produced nothing." : digital.error);
  return { text: capText(digital.ok ? digital.stdout : ""), engine: digital.ok ? "pdftotext" : "none", error };
}

async function ocrPdfViaRaster(storedPath: string): Promise<DocumentTextResult> {
  let workDir: string | undefined;
  try {
    workDir = await mkdtemp(join(tmpdir(), "intake-ocr-"));
    const prefix = join(workDir, "page");
    // Rasterise up to MAX_OCR_PAGES at 200 DPI as PNGs: page-1.png, page-2.png...
    await runCommand("pdftoppm", ["-png", "-r", "200", "-l", String(MAX_OCR_PAGES), storedPath, prefix]);
    // Sort by the numeric page index (page-2 before page-10), not lexically, so
    // multi-page text reaches OCR/Ollama in reading order.
    const files = (await readdir(workDir))
      .filter((name) => name.endsWith(".png"))
      .sort((a, b) => pageNumber(a) - pageNumber(b));
    if (files.length === 0) return { text: "", engine: "none", error: "pdftoppm produced no page images." };

    const pages: string[] = [];
    for (const file of files) {
      const page = await ocrImage(join(workDir, file));
      if (page.text) pages.push(page.text);
    }
    // Hitting the page cap means the PDF may have further, unread pages.
    const truncated = files.length >= MAX_OCR_PAGES;
    return { text: capText(pages.join("\n\n")), engine: "tesseract+pdftoppm", truncated };
  } catch (error) {
    return { text: "", engine: "none", error: toMessage(error) };
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function ocrImage(imagePath: string): Promise<DocumentTextResult> {
  // `tesseract <img> stdout` writes recognised text to stdout.
  const result = await runCommand("tesseract", [imagePath, "stdout"]);
  return { text: capText(result.stdout), engine: "tesseract" };
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
