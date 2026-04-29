"use client"

import { useState, useEffect } from "react"
import { X, Download, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { getTimetableSignedUrl } from "@/app/actions/timetables"
import { useIsMobile }           from "@/hooks/use-is-mobile"

interface Props {
  filePath: string
  fileType: "pdf" | "docx"
  title:    string
  onClose:  () => void
}

export function TimetableViewerDialog({ filePath, fileType, title, onClose }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    getTimetableSignedUrl(filePath).then((res) => {
      setLoading(false)
      if (res.error || !res.url) {
        setError(res.error ?? "Errore caricamento documento")
        return
      }
      setSignedUrl(res.url)
    })
  }, [filePath])

  // URL per Office Online Viewer (DOCX)
  const officeViewerUrl = signedUrl
    ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(signedUrl)}`
    : null

  // Su mobile + DOCX: Office Online iframe non funziona in Safari/iOS → link diretto
  const showMobileDocxFallback = isMobile && fileType === "docx" && !!signedUrl

  const iframeSrc = signedUrl
    ? fileType === "pdf"
      ? signedUrl
      : officeViewerUrl!
    : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/20 bg-white/95 px-5 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Timetable · {fileType === "pdf" ? "PDF" : "Word"}
          </p>
          <p className="truncate text-sm font-bold text-foreground">{title}</p>
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          {signedUrl && (
            <a
              href={signedUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
              Scarica
            </a>
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contenuto */}
      <div className="flex flex-1 items-center justify-center overflow-hidden bg-white">

        {loading && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Caricamento documento…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/50 px-8 py-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{error}</p>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-muted px-4 py-2 text-sm font-semibold hover:bg-muted/80"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* Mobile + DOCX: Office Online non funziona in iframe su Safari/iOS */}
        {showMobileDocxFallback && (
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              La visualizzazione inline dei file Word non è supportata su mobile.
            </p>
            <a
              href={officeViewerUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" />
              Apri nel browser
            </a>
            <a
              href={signedUrl!}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Scarica il file
            </a>
          </div>
        )}

        {/* Desktop o PDF: iframe normale */}
        {iframeSrc && !showMobileDocxFallback && (
          <iframe
            src={iframeSrc}
            title={title}
            className="h-full w-full"
            style={{ border: "none" }}
          />
        )}
      </div>
    </div>
  )
}
