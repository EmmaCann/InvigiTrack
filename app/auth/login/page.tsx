import { AuthPage } from "@/components/auth/auth-page"

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ auth_error?: string | string[] }>
}) {
  const { auth_error } = await searchParams
  const fallbackError = auth_error === "invalid_credentials" ? "Email o password non corrette."
    : auth_error === "login" ? "Accesso non riuscito. Controlla i dati e riprova."
    : auth_error === "register" ? "Registrazione non riuscita. Controlla i dati e riprova." : undefined
  return <AuthPage fallbackError={fallbackError} />
}
