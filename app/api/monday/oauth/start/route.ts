import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const clientId = process.env.MONDAY_CLIENT_ID
  // Derive the base URL from the incoming request – this avoids mismatches
  // between the env value and what Monday expects. We still allow an env var
  // override for production deployments behind custom domains.
  const detectedOrigin = `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host")}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? detectedOrigin

  if (!clientId || !appUrl) {
    return NextResponse.json(
      { error: "Missing env vars MONDAY_CLIENT_ID or NEXT_PUBLIC_APP_URL" },
      { status: 500 },
    )
  }

  const state = crypto.randomUUID()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/monday/oauth/callback`,
    response_type: "code",
    state,
    scope: "boards:read boards:write",
  })

  const authUrl = `https://auth.monday.com/oauth2/authorize?${params.toString()}`

  const res = NextResponse.redirect(authUrl)
  // Store the state value in a secure, httpOnly cookie so we can verify the
  // callback request was initiated by us (CSRF protection).
  res.cookies.set("monday_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  })

  return res
} 