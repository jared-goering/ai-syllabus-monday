import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 })
  }

  const cookieStore = req.cookies
  const storedState = cookieStore.get("monday_oauth_state")?.value

  if (!storedState || storedState !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 })
  }

  const clientId = process.env.MONDAY_CLIENT_ID
  const clientSecret = process.env.MONDAY_CLIENT_SECRET
  // Use incoming request host as base URL unless overridden by env.
  const detectedOrigin = `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host")}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? detectedOrigin

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    )
  }

  const tokenRes = await fetch("https://auth.monday.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${appUrl}/api/monday/oauth/callback`,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    const msg = await tokenRes.text()
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const tokenJson = await tokenRes.json()
  const accessToken = tokenJson.access_token as string | undefined
  const expiresIn = tokenJson.expires_in as number | undefined

  if (!accessToken) {
    return NextResponse.json({ error: "No access token in response" }, { status: 500 })
  }

  const res = NextResponse.redirect(`${appUrl}?connected=1`)
  res.cookies.set("monday_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: expiresIn ?? 365 * 24 * 60 * 60, // fallback 1 year
    sameSite: "lax",
  })
  // Cleanup state cookie
  res.cookies.delete("monday_oauth_state")

  return res
} 