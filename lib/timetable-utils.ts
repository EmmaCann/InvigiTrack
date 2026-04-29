/**
 * Utility condivise per l'upload di timetable.
 * Usate da TimetablePanel e EventDialog.
 */

export const TIMETABLE_ACCEPT =
  ".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"

export const MAX_TIMETABLE_MB = 10
export const MAX_TIMETABLE_B  = MAX_TIMETABLE_MB * 1024 * 1024

export function detectFileType(file: File): "pdf" | "docx" | null {
  if (file.type === "application/pdf") return "pdf"
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword" ||
    file.name.endsWith(".docx") ||
    file.name.endsWith(".doc")
  ) return "docx"
  return null
}

export function getFileExtension(file: File): string {
  if (file.name.includes(".")) return file.name.split(".").pop()!.toLowerCase()
  return file.type === "application/pdf" ? "pdf" : "docx"
}
