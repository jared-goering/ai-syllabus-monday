import { openai } from "./openai"

export interface Assignment {
  id: string
  title: string
  dueDate: string | null
  points: number | null
  category: string | null
}

/**
 * Calls OpenAI to extract assignment data from the raw syllabus text.
 * The model is instructed to return a valid JSON array of Assignment objects.
 */
export async function extractAssignmentsFromText(text: string): Promise<Assignment[]> {
  const messages = [
    {
      role: "system" as const,
      content:
        "You are an assistant that reads university course syllabi and extracts an array of assignments. Respond ONLY with valid JSON in the following format: [{\"id\": string, \"title\": string, \"dueDate\": string | null, \"points\": number | null, \"category\": string | null}] where dueDate is in ISO 8601 YYYY-MM-DD format if available. If a field is missing set it to null. Do NOT include markdown fences. Do NOT wrap the JSON in any other text.",
    },
    {
      role: "user" as const,
      content: `Syllabus text:\n\n${text}`,
    },
  ]

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0,
    max_tokens: 1024,
  })

  const raw = completion.choices[0].message.content?.trim() || "[]"
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "") // remove ```json or ```JSON
      .replace(/^```\s*/i, "") // remove ```
      .replace(/```\s*$/i, "") // remove trailing ```
      .trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed as Assignment[]
    if (Array.isArray((parsed as any).assignments)) return (parsed as any).assignments as Assignment[]
    console.error("GPT response is not an array", parsed)
    return []
  } catch (e) {
    console.error("Failed to parse GPT response", e, raw)
    return []
  }
} 