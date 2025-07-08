"use client"

import { useState, useEffect, type DragEvent } from "react"
import { UploadCloud, FileText, CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type Assignment = {
  id: string
  title: string
  dueDate: Date | undefined
  points: number
  category: "Homework" | "Quiz" | "Exam" | "Project"
}

export default function SyllabusImporter() {
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<"idle" | "uploading" | "editing">("idle")
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courseName, setCourseName] = useState<string>("")
  const [connected, setConnected] = useState<boolean>(false)

  // Check monday connection status once on mount
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/monday/status")
        if (res.ok) {
          const json = await res.json()
          setConnected(Boolean(json.connected))
        }
      } catch (_) {
        /* ignore */
      }
    }
    check()
  }, [])

  // Reset upload progress when status changes away from uploading
  useEffect(() => {
    if (status !== "uploading") {
      setUploadProgress(null)
    }
  }, [status])

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (
        file.name.toLowerCase().endsWith(".docx") ||
        file.type.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml")
      ) {
        setFileName(file.name)
        setStatus("uploading")

        // Prepare form data and send to backend
        const body = new FormData()
        body.append("file", file)

        try {
          const res = await fetch("/api/syllabus", {
            method: "POST",
            body,
          })

          if (!res.ok) {
            throw new Error(await res.text())
          }

          const { assignments } = await res.json()

          // Convert ISO dates to Date objects for UI components
          const parsed = (assignments || []).map((a: any, idx: number) => ({
            id: a.id ?? String(idx + 1),
            title: a.title ?? "Untitled",
            dueDate: a.dueDate ? new Date(a.dueDate) : undefined,
            points: a.points ?? 0,
            category: (a.category as Assignment["category"]) ?? "Homework",
          })) as Assignment[]

          setAssignments(parsed)
          if (!courseName) {
            const name = file.name.replace(/\.[^.]+$/, "")
            setCourseName(name)
          }
          setStatus("editing")
        } catch (err) {
          console.error(err)
          alert("Failed to process syllabus. Check console for details.")
          handleReset()
        }
      }
    }
  }

  const handleAssignmentChange = (id: string, field: keyof Assignment, value: any) => {
    setAssignments((prev) =>
      prev.map((assignment) => (assignment.id === id ? { ...assignment, [field]: value } : assignment)),
    )
  }

  const handleReset = () => {
    setStatus("idle")
    setUploadProgress(null)
    setFileName(null)
    setAssignments([])
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Syllabus Importer</CardTitle>
        <CardDescription>Drag and drop a syllabus file (DOCX) to extract assignments.</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "idle" && (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 text-center transition-colors",
              isDragging && "bg-accent border-primary",
            )}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-semibold text-lg">Drag & drop your file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <Input type="file" className="sr-only" accept=".docx" />
          </div>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center justify-center p-8">
            <FileText className="h-10 w-10 text-primary" />
            <p className="mt-4 mb-2 font-medium">{fileName}</p>
            <p className="text-sm text-muted-foreground mb-4">Processing syllabus...</p>
            {uploadProgress !== null ? (
              <Progress value={uploadProgress} className="w-full max-w-sm" />
            ) : (
              <p className="text-muted-foreground">This may take a minute...</p>
            )}
          </div>
        )}

        {status === "editing" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Extracted Assignments</h3>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-2" />
                Start Over
              </Button>
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div>
                <Label htmlFor="course-name">Course Name</Label>
                <Input
                  id="course-name"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g., CS101 – Intro to Programming"
                  className="w-[300px]"
                />
              </div>
            </div>
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px] w-2/5">Title</TableHead>
                    <TableHead className="min-w-[200px]">Due Date</TableHead>
                    <TableHead className="min-w-[100px]">Points</TableHead>
                    <TableHead className="min-w-[150px]">Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="max-w-0">
                        <Input
                          value={assignment.title}
                          onChange={(e) => handleAssignmentChange(assignment.id, "title", e.target.value)}
                          className="w-full min-w-[280px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[200px] justify-start text-left font-normal truncate",
                                !assignment.dueDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                {assignment.dueDate ? format(assignment.dueDate, "MMM d, yyyy") : "Pick a date"}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={assignment.dueDate}
                              onSelect={(date) => handleAssignmentChange(assignment.id, "dueDate", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={assignment.points}
                          onChange={(e) =>
                            handleAssignmentChange(assignment.id, "points", Number.parseInt(e.target.value) || 0)
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={assignment.category}
                          onValueChange={(value) => handleAssignmentChange(assignment.id, "category", value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Homework">Homework</SelectItem>
                            <SelectItem value="Quiz">Quiz</SelectItem>
                            <SelectItem value="Exam">Exam</SelectItem>
                            <SelectItem value="Project">Project</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="flex gap-4 items-center">
                {!connected && (
                  <Button asChild variant="outline">
                    <Link href="/api/monday/oauth/start">Connect monday.com</Link>
                  </Button>
                )}
                <Button
                  size="lg"
                  disabled={!courseName || !connected}
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/monday", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          courseName,
                          assignments: assignments.map((a) => ({
                            ...a,
                            dueDate: a.dueDate ? a.dueDate.toISOString().split("T")[0] : null,
                          })),
                        }),
                      })

                      if (res.status === 401) {
                        // Not connected -> start OAuth flow
                        window.location.href = "/api/monday/oauth/start"
                        return
                      }

                      if (!res.ok) throw new Error(await res.text())
                      alert("Successfully pushed to Monday.com!")
                    } catch (err) {
                      console.error(err)
                      alert("Failed to push to Monday.com. Check console for details.")
                    }
                  }}
                >
                  Import to Monday.com
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
