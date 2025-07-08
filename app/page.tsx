import SyllabusImporter from "@/components/syllabus-importer"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const cookieStore = cookies()
  const connected = cookieStore.has("monday_access_token")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        {/* Connection status / action */}
        <div className="mb-4 flex justify-end">
          {connected ? (
            <Badge className="text-sm">Connected to monday.com</Badge>
          ) : (
            <Button asChild variant="outline">
              <Link href="/api/monday/oauth/start">Connect monday.com</Link>
            </Button>
          )}
        </div>

        <SyllabusImporter />
      </div>
    </main>
  )
}
