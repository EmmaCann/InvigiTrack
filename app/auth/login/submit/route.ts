import { signInWithPassword } from "@/lib/data/auth"

function redirectTo(path: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: path, "Cache-Control": "private, no-store" },
  })
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin")
  const sameOrigin = request.headers.get("sec-fetch-site") === "same-origin"
    || origin === new URL(request.url).origin
  const backToLogin = (error: "login" | "invalid_credentials") =>
    redirectTo(`/auth/login?auth_error=${error}`)

  if (!sameOrigin) return backToLogin("login")

  try {
    const result = await signInWithPassword(await request.formData())
    if (!result.error) return redirectTo("/dashboard")
    return backToLogin(result.error.code === "invalid_credentials" ? "invalid_credentials" : "login")
  } catch {
    return backToLogin("login")
  }
}
