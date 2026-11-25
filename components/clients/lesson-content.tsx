import { Download, FileText } from "lucide-react"
import type { Upload } from "@/lib/clients/location-lessons"

export const lessonDate = (date: string) => new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeZone: "UTC" })
  .format(new Date(`${date}T00:00:00Z`))

export function LessonFileList({ uploads, base, deliveries = false }: { uploads: Upload[]; base: string; deliveries?: boolean }) {
  if (!uploads.length) return null
  return <ul className="space-y-2">{uploads.map((upload) => <li key={upload.id} className="space-y-1">
    {deliveries && <p className="text-xs font-medium text-muted-foreground">
      {new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" }).format(new Date(upload.confirmed_at))}
    </p>}
    <ul className="space-y-1">{upload.location_lesson_files.map((file) => <li key={file.id}>
      <a href={`${base}/file/${file.id}`} className="flex items-center gap-2 rounded-xl border border-primary/10 bg-primary/[0.035] px-3 py-2 text-sm font-medium text-primary hover:bg-primary/[0.08]">
        <FileText className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 break-words">{file.name}</span>
        <Download className="size-4 shrink-0" aria-hidden />
      </a>
    </li>)}</ul>
  </li>)}</ul>
}
