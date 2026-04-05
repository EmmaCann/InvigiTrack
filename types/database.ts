/**
 * TYPES — la "forma" dei dati del database.
 *
 * Questi tipi rispecchiano esattamente le tabelle Supabase.
 * Nessuna logica qui — solo TypeScript che descrive la struttura.
 *
 * Analogia Laravel: come i $fillable e $casts del Model,
 * ma separati dal codice che fa le query.
 */

// ─── Enum / Union types ───────────────────────────────────────────────────────

/** Ruolo all'interno di una sessione di invigilation */
export type InvigilationRole = "invigilator" | "supervisor"

/** Ruolo sulla piattaforma — controlla l'accesso alle funzionalità admin */
export type PlatformRole = "user" | "admin"

/** Stato del pagamento di una sessione */
export type PaymentStatus = "unpaid" | "pending" | "paid"

// ─── Metadata JSONB — tipizzati per categoria ─────────────────────────────────
//
// Il campo metadata nella tabella sessions è JSONB (JSON flessibile nel DB).
// Ogni categoria ha la sua "forma" di metadata.
// TypeScript ci permette di tipizzarli in modo sicuro.

/** Campi specifici per sessioni di invigilation */
export interface InvigilationMetadata {
  exam_name: string
  role_type?: InvigilationRole  // ruolo in QUESTA sessione
}

/** Campi specifici per sessioni di tutoraggio — Fase 2 */
export interface TutoringMetadata {
  student_name: string
  subject: string
  level?: string  // es. "GCSE", "A-Level"
}

/** Campi specifici per sessioni di personal training — Fase 2 */
export interface PersonalTrainingMetadata {
  client_name: string
  session_type: string
  focus_area?: string
}

/** Union: il metadata può essere uno qualsiasi dei tipi sopra */
export type SessionMetadata =
  | InvigilationMetadata
  | TutoringMetadata
  | PersonalTrainingMetadata
  | Record<string, unknown>

// ─── Tabelle del database ─────────────────────────────────────────────────────

/** Riga della tabella `profiles` */
export interface Profile {
  id: string                          // = auth.users.id
  email: string
  full_name: string | null
  role_type: InvigilationRole | null  // null per chi non fa invigilation
  platform_role: PlatformRole
  default_hourly_rate: number
  rounding_mode: string
  created_at: string
  updated_at: string
}

/** Riga della tabella `work_categories` */
export interface WorkCategory {
  id: string
  slug: string
  label: string
  description: string | null
  is_active: boolean
  created_at: string
}

/** Riga della tabella `user_category_access` */
export interface UserCategoryAccess {
  user_id: string
  category_id: string
  granted_at: string
  granted_by: string | null
}

/** Riga della tabella `sessions` */
export interface Session {
  id: string
  user_id: string
  category_id: string
  session_date: string      // "2026-03-29"
  start_time: string        // "09:00:00"
  end_time: string          // "12:30:00"
  duration_minutes: number  // GENERATED dal DB — sola lettura
  location: string | null
  hourly_rate: number
  earned: number
  payment_status: PaymentStatus
  paid_at: string | null
  metadata: SessionMetadata
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── Calendario ───────────────────────────────────────────────────────────────

/** Riga della tabella `calendar_events` */
export interface CalendarEvent {
  id:                   string
  user_id:              string
  event_date:           string        // "2026-04-28"
  title:                string
  location:             string | null
  notes:                string | null
  is_converted:         boolean       // true quando è stata creata una sessione da questo evento
  converted_session_id: string | null // id della sessione creata
  created_at:           string
  updated_at:           string
}

/** Dati per creare un nuovo evento calendario */
export interface CreateEventData {
  event_date: string
  title:      string
  location?:  string
  notes?:     string
}

// ─── Pagamenti ────────────────────────────────────────────────────────────────

export type PaymentMethod = "bank_transfer" | "cash" | "other"

/** Riga della tabella `payments` */
export interface Payment {
  id:           string
  user_id:      string
  payment_date: string          // "2026-04-01"
  amount:       number          // importo effettivamente ricevuto
  method:       PaymentMethod
  reference:    string | null   // es. numero CRO bonifico
  notes:        string | null
  created_at:   string
}

/** Riga della tabella `payment_sessions` */
export interface PaymentSession {
  payment_id: string
  session_id: string
}

/** Payment arricchito con le sessioni collegate (per lo storico) */
export interface PaymentWithSessions extends Payment {
  sessions: Session[]
}

// ─── Tipi per form e Server Actions ──────────────────────────────────────────

/** Dati raccolti durante l'onboarding */
export interface OnboardingData {
  full_name: string
  role_type: InvigilationRole | null
  default_hourly_rate: number
  /**
   * Usato solo dall'admin: slug della categoria di lavoro primaria
   * ('invigilation' | 'tutoring' | 'personal_training').
   * Gli utenti normali sono sempre 'invigilation' automaticamente.
   */
  primary_category_slug?: string
}

/** Dati per creare una nuova sessione */
export interface CreateSessionData {
  session_date: string
  start_time: string
  end_time: string
  location?: string
  hourly_rate: number
  notes?: string
  metadata: InvigilationMetadata
}

/**
 * Helper: converte il metadata generico nel tipo specifico.
 * Uso: const meta = asMetadata<InvigilationMetadata>(session)
 */
export function asMetadata<T extends SessionMetadata>(session: Session): T {
  return session.metadata as T
}
