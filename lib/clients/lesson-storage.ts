export const lessonBucket = "location-lesson-files"

export const lessonFileTypes = {
  pdf: "application/pdf",
  pages: "application/vnd.apple.pages",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
} as const

export function lessonFileExtension(name: string) {
  const extension = /\.([^.]+)$/.exec(name)?.[1].toLowerCase() as keyof typeof lessonFileTypes | undefined
  return extension && Object.hasOwn(lessonFileTypes, extension) ? extension : null
}

export const allowedLessonFilesMessage = "Formati consentiti: PDF, Word (.docx), Pages (.pages), TXT, JPG e PNG."

export const lessonFileAccept = [
  ...Object.keys(lessonFileTypes).map((type) => `.${type}`),
  ...new Set(Object.values(lessonFileTypes)),
  "application/x-iwork-pages-sffpages",
].join(",")

const startsWith = (bytes: Uint8Array, signature: number[]) => signature.every((value, index) => bytes[index] === value)

function detectZippedDocument(bytes: Uint8Array, pagesHint: boolean) {
  if (!startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || bytes.length < 22) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  // The ZIP end record can be followed by up to 65,535 bytes of comment.
  const first = Math.max(0, bytes.length - 22 - 65_535)
  let end = bytes.length - 22
  for (; end >= first; end--) {
    if (view.getUint32(end, true) === 0x06054b50 && end + 22 + view.getUint16(end + 20, true) === bytes.length) break
  }
  if (end < first) return null
  const entries = view.getUint16(end + 10, true)
  const decoder = new TextDecoder()
  let offset = view.getUint32(end + 16, true)
  const names = new Set<string>()
  for (let i = 0; i < entries; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) return null
    const length = view.getUint16(offset + 28, true)
    const nextOffset = offset + 46 + length + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true)
    if (nextOffset > end) return null
    names.add(decoder.decode(bytes.subarray(offset + 46, offset + 46 + length)))
    offset = nextOffset
  }
  if (names.has("[Content_Types].xml") && names.has("word/document.xml") && !names.has("word/vbaProject.bin")) return "docx"
  // Pages, Numbers and Keynote share the iWork container. Require the Pages name or MIME hint.
  if (pagesHint && names.has("Metadata/Properties.plist") && names.has("Index/Document.iwa")) return "pages"
  return null
}

export function detectLessonFileExtension(bytes: Uint8Array, pagesHint = false) {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf"
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png"
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpg"
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return detectZippedDocument(bytes, pagesHint)
  if (bytes.length === 0 || bytes.some((byte) => byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) return null
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    return "txt"
  } catch {
    return null
  }
}
