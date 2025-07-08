import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const connected = !!req.cookies.get("monday_access_token")?.value
  return NextResponse.json({ connected })
} 