/** Legge soltanto il numero di byte previsto per le richieste JSON e i segreti. */
export async function readSmallBody(request: Request, limit: number) {
  const declared = Number(request.headers.get("content-length"))
  if (declared > limit || !request.body) return null
  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let text = ""
  let size = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) return text + decoder.decode()
      size += value.byteLength
      if (size > limit) {
        await reader.cancel()
        return null
      }
      text += decoder.decode(value, { stream: true })
    }
  } finally {
    reader.releaseLock()
  }
}
