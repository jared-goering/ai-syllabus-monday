import { NextRequest, NextResponse } from "next/server"

import { extractTextFromFile } from "@/lib/extractText"
import { extractAssignmentsFromText } from "@/lib/assignmentExtractor"

export const runtime = "nodejs" // use Node.js runtime for pdf/mammoth

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "File missing" }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  try {
    const text = await extractTextFromFile(buffer, file.type, file.name)
    const assignments = await extractAssignmentsFromText(text)

    return NextResponse.json({ assignments })
  } catch (e: any) {
    console.error("Failed to process syllabus", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
} 