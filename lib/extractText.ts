import mammoth from "mammoth"
import pdfParse from "pdf-parse/lib/pdf-parse"

export async function extractTextFromFile(buffer: Buffer, mimeType: string, fileName = ""): Promise<string> {
  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    try {
      const data = await pdfParse(buffer)
      return data.text
    } catch (error) {
      console.error("PDF parsing failed:", error)
      throw new Error("Failed to parse PDF file. Please ensure the file is not corrupted and try again.")
    }
  }

  // Most DOCX files come across with this mime type in browsers when using FormData uploads.
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.toLowerCase().endsWith(".docx")
  ) {
    try {
      const { value } = await mammoth.extractRawText({ buffer })
      return value
    } catch (error) {
      console.error("DOCX parsing failed:", error)
      throw new Error("Failed to parse DOCX file. Please ensure the file is not corrupted and try again.")
    }
  }

  throw new Error(`Unsupported file type: ${mimeType}. Please use DOCX files.`)
} 