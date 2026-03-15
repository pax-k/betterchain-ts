import { PDFParse } from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();

  const text = result.text;

  if (!text || text.trim().length === 0) {
    throw new Error(
      "No text could be extracted from the PDF. It may be image-based or encrypted."
    );
  }

  return text;
}
