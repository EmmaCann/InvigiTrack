/**
 * TYPES — la "forma" dei dati del database.
 *
 * Questi tipi rispecchiano esattamente le tabelle Supabase.
 * Nessuna logica qui — solo TypeScript che descrive la struttura.
 *
 * Analogia Laravel: come i $fillable e $casts del Model,
 * ma separati dal codice che fa le query.
 */

// --- Enum / Union types -------------------------------------------------------

/** Ruolo all'interno di una sessione di invigilation */
export type InvigilationRole = "invigilator" | "supervisor"

/** Ruolo sulla piattaforma — controlla l'accesso alle funzionalità admin */
export type PlatformRole = "user" | "admin" | "super_admin"

// --- Notifications & Feedback -------------------------------------------------

export type NotificationType = "system" | "update" | "maintenance" | "feedback_received"
export type NotificationTargetType = "all" | "role" | "user"
export type FeedbackType = "feature_request" | "bug_report" | "suggestion"
export type FeedbackStatus = "new" | "read"

export interface Notification {
  id:             string
  target_type:    NotificationTargetType
  target_role:    PlatformRole | null  // se target_type = "role"
  target_user_id: string | null        // se target_type = "user"
  title:          string
  message:        string
  type:           NotificationType
  created_by:     string | null
  created_at:     string
}

export interface NotificationWithRead extends Notification {
  is_read: boolean
}

export interface Feedback {
  id:         string
  user_id:    string | null
  user_email: string | null
  type:       FeedbackType
  subject:    string
  message:    string
  status:     FeedbackStatus
  created_at: string
}

// --- Analytics prefs & archive -----------------------------------------------

/** ID dei widget disponibili nella pagina analytics */
export type AnalyticsWidgetId =
  | "earnings_trend"     // andamento guadagni mensili
  | "hours_trend"        // ore lavorate mensili
  | "year_comparison"    // anno corrente vs precedente
  | "payment_breakdown"  // donut paid/pending/unpaid
  | "session_frequency"  // sessioni per giorno settimana
  | "top_locations"      // top 5 sedi

/** Preferenze analytics salvate in profiles.analytics_prefs (JSONB) */
export interface AnalyticsPrefs {
  widgets?:      AnalyticsWidgetId[]  // undefined = tutte attive
  goal_monthly?: number | null        // obiettivo mensile in €
  goal_annual?:  number | null        // obiettivo annuale in €
}

/** Widget secondari nella colonna destra della dashboard */
export type DashboardSecondaryWidget =
  | "hours_trend"      // andamento ore (CSS mini bar chart)
  | "earnings_mini"    // andamento guadagni (CSS mini bar chart)
  | "unpaid_alerts"    // sessioni non pagate
  | "calendar_events"  // prossimi eventi calendario

/** Preferenze pagina sessioni */
export interface SessionsPrefs {
  default_filter?: "all" | "unpaid" | "paid"  // filtro applicato all'apertura
  grouping?:       "date" | "month"            // "date" = lista flat, "month" = raggruppata
}

/** Preferenze pagina pagamenti */
export interface PaymentsPrefs {
  default_tab?: "pending" | "history"  // tab aperta all'apertura
}

/** Riga mensile salvata nell'archivio annuale */
export interface MonthlyArchiveEntry {
  month:    number   // 1–12
  sessions: number
  hours:    number
  earned:   number
  paid:     number
  unpaid:   number
}

/** Riga della tabella `yearly_archives` */
export interface YearlyArchive {
  id:             string
  user_id:        string
  workspace_id:   string
  year:           number
  total_sessions: number
  total_hours:    number
  total_earned:   number
  total_paid:     number
  total_unpaid:   number
  archive_data: {
    monthly:       MonthlyArchiveEntry[]
    day_of_week:   { day: number; sessions: number }[]   // 0 = Lunedì
    top_locations: { name: string; sessions: number }[]
  }
  archived_at: string
}

// --- Dashboard prefs ----------------------------------------------------------

/** ID delle card disponibili nella dashboard */
export type DashboardCardId =
  | "hours_month"     // ore lavorate questo mese
  | "total_earned"    // totale guadagnato (storico)
  | "unpaid"          // da ricevere
  | "sessions_count"  // sessioni totali
  | "earned_month"    // guadagnato questo mese
  | "paid"            // già ricevuto
  | "avg_hourly"      // tariffa media

/** Preferenze dashboard salvate in profiles.dashboard_prefs (JSONB) */
export interface DashboardPrefs {
  cards?:     DashboardCardId[]           // KPI card (max 4); undefined = default
  secondary?: DashboardSecondaryWidget[]  // widget colonna destra; undefined = default tutti
}

/** Stato del pagamento di una sessione */
export type PaymentStatus = "unpaid" | "pending" | "paid"

// --- Metadata JSONB — tipizzati per categoria ---------------------------------
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

// --- Tabelle del database -----------------------------------------------------

/**
 * Stato UI per-account — traccia popup/dialog/tour visualizzati.
 * Estendibile: aggiungere nuove chiavi senza migration.
 */
export interface UiState {
  welcome_seen?: boolean   // popup di benvenuto al primo accesso
  tour_seen?:    boolean   // tour interattivo della dashboard
}

/** Riga della tabella `profiles` */
export interface Profile {
  id: string                          // = auth.users.id
  email: string
  full_name: string | null
  role_type: InvigilationRole | null  // null per chi non fa invigilation
  platform_role: PlatformRole
  default_hourly_rate: number
  rounding_mode: string
  dashboard_prefs:  DashboardPrefs    // preferenze card + widget dashboard
  analytics_prefs:  AnalyticsPrefs   // preferenze pagina analytics
  sessions_prefs:   SessionsPrefs    // preferenze pagina sessioni
  payments_prefs:   PaymentsPrefs    // preferenze pagina pagamenti
  ui_state:         UiState          // stato popup/dialog per-account
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
  id: string                              // UUID PK (aggiunto con migration)
  user_id: string
  category_id: string
  granted_at: string
  granted_by: string | null
  default_hourly_rate: number | null      // tariffa specifica per questo workspace
}

/**
 * Workspace personalizzato dell'utente: combina WorkCategory con le
 * impostazioni custom salvate in user_category_access (nome, emoji, colore).
 * `workspaceId` è il PK UUID di user_category_access — usato per identificare
 * univocamente questo workspace anche se due workspace condividono la stessa categoria.
 */
export interface UserWorkspace extends WorkCategory {
  workspaceId: string              // PK di user_category_access (uuid)
  emoji: string | null             // emoji personalizzata, es. "📚"
  color: string | null             // colore hex personalizzato, es. "#3B82F6"
  default_hourly_rate: number | null  // tariffa oraria specifica per questo workspace
}

/** Riga della tabella `sessions` */
export interface Session {
  id: string
  user_id: string
  category_id: string
  workspace_id: string | null  // FK → user_category_access.id
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

// --- Calendario ---------------------------------------------------------------

/** Riga della tabella `calendar_events` */
export interface CalendarEvent {
  id:                   string
  user_id:              string
  event_date:           string        // "2026-04-28"
  start_time:           string | null // "09:00:00" opzionale
  end_time:             string | null // "12:30:00" opzionale
  title:                string
  location:             string | null
  notes:                string | null
  is_converted:         boolean       // true quando è stata creata una sessione da questo evento
  converted_session_id: string | null // id della sessione creata
  category_id:          string | null // tipo di lavoro (indicativo)
  workspace_id:         string | null // FK → user_category_access.id
  created_at:           string
  updated_at:           string
}

/** Dati per creare un nuovo evento calendario */
export interface CreateEventData {
  event_date:    string
  start_time?:   string  // "09:00" opzionale
  end_time?:     string  // "12:30" opzionale
  title:         string
  location?:     string
  notes?:        string
  category_id?:  string  // tipo di lavoro (indicativo)
  workspace_id?: string  // workspace specifico a cui appartiene l'evento
}

// --- Timetable ----------------------------------------------------------------

/** Riga della tabella `timetables` — documento per-evento Cambridge (PDF o DOCX) */
export interface Timetable {
  id:         string
  user_id:    string
  event_id:   string | null   // FK → calendar_events.id
  file_path:  string | null   // null quando is_expired = true
  file_type:  "pdf" | "docx"
  file_size:  number | null   // bytes
  is_expired: boolean
  created_at: string
}

// --- Pagamenti ----------------------------------------------------------------

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

// --- Tipi per form e Server Actions ------------------------------------------

/** Dati raccolti durante l'onboarding */
export interface OnboardingData {
  full_name: string
  role_type: InvigilationRole | null
  default_hourly_rate: number
  /**
   * Usato solo dall'admin: slug della categoria di lavoro primaria
   * ('invigilation' | 'tutoring' | 'personal_training' | 'custom').
   * Gli utenti normali sono sempre 'invigilation' automaticamente.
   */
  primary_category_slug?: string
  /** Presente solo quando primary_category_slug === 'custom' */
  custom_category_label?:       string
  custom_category_description?: string
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
