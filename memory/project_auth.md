---
name: Auth system implementation
description: Auth system architecture decisions for InvigiTrack
type: project
---

Sistema auth implementato con Supabase + @supabase/ssr + Next.js App Router.

Decisioni chiave:
- Env var: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (non ANON_KEY — naming Supabase più recente)
- Profiles table usa email come chiave di collegamento (non auth.users.id) — id è uuid separato
- Primo login rilevato da assenza profilo in profiles table → mostra OnboardingDialog
- Middleware a root level per protezione route e refresh sessione
- Server Actions in app/actions/auth.ts

**Why:** User vuole imparare il techstack, quindi il codice è commentato con analogie Laravel.
**How to apply:** Mantenere commenti esplicativi nel codice, usare analogie Laravel per spiegazioni.
