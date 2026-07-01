import { describe, expect, it } from "vitest";
import { extractDocumentText, isImage, isPdf } from "./document-read";

describe("isPdf / isImage", () => {
  it("detects PDFs by mime type or extension", () => {
    expect(isPdf("application/pdf", "x")).toBe(true);
    expect(isPdf(null, "invoice.PDF")).toBe(true);
    expect(isPdf("image/png", "photo.png")).toBe(false);
  });

  it("detects images by mime type or extension", () => {
    expect(isImage("image/jpeg", "x")).toBe(true);
    expect(isImage(null, "scan.TIFF")).toBe(true);
    expect(isImage("application/pdf", "doc.pdf")).toBe(false);
  });
});

describe("extractDocumentText", () => {
  it("returns an error for an unsupported file type without invoking OCR", async () => {
    const result = await extractDocumentText({ storedPath: "/tmp/whatever.txt", mimeType: "text/plain", filename: "notes.txt" });
    expect(result.text).toBe("");
    expect(result.engine).toBe("none");
    expect(result.error).toContain("Unsupported file type");
  });
});
