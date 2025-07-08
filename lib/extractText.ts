import mammoth from "mammoth"

export async function extractTextFromFile(buffer: Buffer, mimeType: string, fileName = ""): Promise<string> {
  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    // For now, return a placeholder message for PDF files
    // In a production environment, you would want to use a proper PDF parsing library
    // that works in Node.js environments
    throw new Error("PDF parsing is currently not supported. Please use DOCX files for now.")
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