"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileText, Eye, Trash2, Upload, Loader2, AlertCircle } from "lucide-react"
import { createClient }                      from "@/lib/supabase/client"
import { saveTimetable, removeTimetable }    from "@/app/actions/timetables"
import { TimetableViewerDialog }             from "./timetable-viewer-dialog"
import type { Timetable } from "@/types/database"

const MAX_FILE_MB = 10
const MAX_FILE_B  = MAX_FILE_MB * 1024 * 1024

const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
])

function detectFileType(file: File): "pdf" | "docx" | null {
  if (file.type === "application/pdf") return "pdf"
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword" ||
    file.name.endsWith(".docx") ||
    file.name.endsWith(".doc")
  ) return "docx"
  return null
}

function getExtension(file: File): string {
  if (file.name.includes(".")) return file.name.split(".").pop()!.toLowerCase()
  return file.type === "application/pdf" ? "pdf" : "docx"
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  eventId:   string
  userId:    string
  title:     string       // titolo evento — usato nell'intestazione del viewer
  timetable: Timetable | null
}

export function TimetablePanel({ eventId, userId, title, timetable }: Props) {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [viewerOpen,  setViewerOpen]  = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [, startDel]                  = useTransition()

  // --- Upload ------------------------------------------------------------------

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const fileType = detectFileType(file)
    if (!fileType) {
      setUploadError("Formato non supportato. Carica un PDF o un file Word (.docx).")
      return
    }
    if (file.size > MAX_FILE_B) {
      setUploadError(`Il file supera il limite di ${MAX_FILE_MB} MB.`)
      return
    }

    setUploadError(null)
    setUploading(true)

    try {
      const ext      = getExtension(file)
      const filePath = `${userId}/${crypto.randomUUID()}.${ext}`
      const supabase = createClient()

      const { error: uploadErr } = await supabase.storage
        .from("timetables")
        .upload(filePath, file, { upsert: false })

      if (uploadErr) {
        setUploadError(uploadErr.message)
        setUploading(false)
        return
      }

      const res = await saveTimetable({
        event_id:  eventId,
        file_path: filePath,
        file_type: fileType,
        file_size: file.size,
      })

      if (res.error) {
        setUploadError(res.error)
        setUploading(false)
        return
      }

      router.refresh()
    } catch {
      setUploadError("Errore durante l'upload. Riprova.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  // --- Delete ------------------------------------------------------------------

  function handleDelete() {
    if (!timetable?.file_path) return
    startDel(async () => {
      await removeTimetable(timetable.id, timetable.file_path!)
      setConfirmDel(false)
      router.refresh()
    })
  }

  // --- Render ------------------------------------------------------------------

  // Caso: documento scaduto
  if (timetable?.is_expired) {
    return (
      <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-border/30 bg-muted/30 px-3 py-2.5">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        <p className="text-[11px] leading-snug text-muted-foreground/70">
          Per motivi di spazio il documento non è più disponibile.
        </p>
      </div>
    )
  }

  // Caso: timetable presente
  if (timetable) {
    const badge = timetable.file_type === "pdf" ? "PDF" : "Word"
    const badgeCls = timetable.file_type === "pdf"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700"

    return (
      <>
        <div className="mt-2.5 rounded-lg border border-blue-200/60 bg-blue-50/40 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-semibold text-foreground">Timetable</p>
                  <span className={`rounded px-1 py-0.5 text-[9px] font-bold uppercase ${badgeCls}`}>
                    {badge}
                  </span>
                </div>
                {timetable.file_size && (
                  <p className="text-[10px] text-muted-foreground">{formatBytes(timetable.file_size)}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setViewerOpen(true)}
                className="flex cursor-pointer items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-700"
              >
                <Eye className="h-3 w-3" />
                Visualizza
              </button>
              <button
                onClick={() => setConfirmDel(true)}
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {confirmDel && (
            <div className="mt-2 flex items-center justify-end gap-2 border-t border-border/30 pt-2">
              <button
                onClick={() => setConfirmDel(false)}
                className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                className="cursor-pointer rounded-md bg-destructive px-2 py-1 text-[10px] font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                Elimina
              </button>
            </div>
          )}
        </div>

        {viewerOpen && timetable.file_path && (
          <TimetableViewerDialog
            filePath={timetable.file_path}
            fileType={timetable.file_type}
            title={title}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </>
    )
  }

  // Caso: nessun timetable — bottone upload
  return (
    <>
      <div className="mt-2.5">
        {uploadError && (
          <p className="mb-1.5 text-[11px] text-destructive">{uploadError}</p>
        )}

        {uploading ? (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Caricamento…</span>
          </div>
        ) : (
          <button
            onClick={() => { setUploadError(null); fileRef.current?.click() }}
            className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground/60 transition-colors hover:text-primary"
          >
            <Upload className="h-3 w-3" />
            Carica timetable (PDF o Word)
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  )
}
