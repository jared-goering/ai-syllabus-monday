import { NextRequest, NextResponse } from "next/server"
import { createBoardAndPushAssignments } from "@/lib/monday"
import { Assignment } from "@/lib/assignmentExtractor"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { courseName, assignments } = (await req.json()) as {
      courseName: string
      assignments: Assignment[]
    }

    if (!courseName || !assignments || !Array.isArray(assignments)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Retrieve the Monday access token that we (optionally) stored during the
    // OAuth callback. If it is missing we bail out with 401 so the client can
    // prompt the user to connect their Monday.com account first.
    const token = req.cookies.get("monday_access_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Not connected to Monday.com" },
        { status: 401 },
      )
    }

    const boardId = await createBoardAndPushAssignments(
      courseName,
      assignments,
      token,
    )
    return NextResponse.json({ success: true, boardId })
  } catch (e: any) {
    console.error("Failed to push to Monday", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
} 