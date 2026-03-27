/**
 * SERVER COMPONENT (default in Next.js App Router).
 * Questa è la pagina di login: /auth/login
 * È un Server Component perché non ha interattività propria —
 * si limita a renderizzare il layout e il form (che è Client Component).
 *
 * Analogia Laravel: come un Controller che fa return view('auth.login')
 */

import { AuthForm } from "@/components/auth/auth-form"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <AuthForm />
    </main>
  )
}
