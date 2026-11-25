"use client"

import { useRef } from "react"
import { startHomeworkUpload, uploadTeacherLessonFiles } from "@/app/actions/location-lessons"
import { LessonUploadForm } from "./lesson-upload-form"

export function HomeworkUploadForm({ sessionId }: { sessionId: string }) {
  const draft = useRef<string | null>(null)

  return <LessonUploadForm task={null} label="Documento del compito" submitLabel="Carica compito"
    uploadAction={async (payload) => {
      if (payload.step === "start") {
        draft.current ??= crypto.randomUUID()
        return startHomeworkUpload(sessionId, draft.current, payload)
      }
      const result = await uploadTeacherLessonFiles(sessionId, "assignment", payload)
      if (result.confirmed) draft.current = null
      return result
    }} />
}
