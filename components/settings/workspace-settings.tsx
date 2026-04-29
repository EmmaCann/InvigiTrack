"use client"

import { useState } from "react"
import { Pencil, Trash2, AlertTriangle, Check, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateWorkspace, deleteWorkspace, addWorkspace, createCategoryAndWorkspace } from "@/app/actions/workspace"
import type { UserWorkspace, WorkCategory } from "@/types/database"

// --- Preset emoji ---------------------------------------------------------------

const EMOJIS = [
  // Istruzione & tutoring
  "📚", "📖", "🎓", "👨‍🏫", "👩‍🏫", "🧑‍🎓", "🏫", "🧮",
  // Sport & fitness
  "🏋️", "💪", "🧘", "🏃", "⚽", "🏊", "🚴", "🤸",
  // Lavoro & business
  "📊", "💼", "🏢", "🔬", "💻", "🎯", "📝", "✏️",
  // Varie
  "🔑", "💡", "🎨", "📅", "🧑‍💻", "🎤", "🏅", "⚡",
  // Bandiere
  "🇬🇧", "🇮🇹", "🇺🇸", "🇫🇷", "🇩🇪", "🇪🇸", "🇯🇵", "🌍",
  // Extra
  "⏰", "🗓️", "🖊️", "🏆", "🌟", "🔖", "📌", "🎵",
]

// --- Preset colori --------------------------------------------------------------

const COLORS = [
  { hex: "#3B82F6", label: "Blu"       },
  { hex: "#10B981", label: "Verde"     },
  { hex: "#8B5CF6", label: "Viola"     },
  { hex: "#F97316", label: "Arancione" },
  { hex: "#EC4899", label: "Rosa"      },
  { hex: "#14B8A6", label: "Teal"      },
  { hex: "#EF4444", label: "Rosso"     },
  { hex: "#F59E0B", label: "Ambra"     },
  { hex: "#6366F1", label: "Indaco"    },
  { hex: "#64748B", label: "Grigio"    },
]

// --- Icona workspace ------------------------------------------------------------

function WorkspaceIcon({ ws, size = "md" }: { ws: UserWorkspace; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "h-12 w-12 rounded-2xl text-2xl" : "h-9 w-9 rounded-xl text-base"
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center font-bold text-white", dim)}
      style={{ backgroundColor: ws.color ?? "#3B82F6" }}
    >
      {ws.emoji ?? ws.label[0].toUpperCase()}
    </span>
  )
}

// --- Card singolo workspace -----------------------------------------------------

function WorkspaceCard({
  ws,
  stats,
  isOnly,
}: {
  ws: UserWorkspace
  stats: { sessions: number; events: number }
  isOnly: boolean
}) {
  const [mode, setMode]       = useState<"view" | "edit" | "delete">("view")
  const [name, setName]       = useState(ws.label)
  const [emoji, setEmoji]     = useState<string | null>(ws.emoji)
  const [color, setColor]     = useState<string | null>(ws.color ?? "#3B82F6")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Workspace preview in tempo reale
  const preview: UserWorkspace = { ...ws, label: name || ws.label, emoji, color }

  async function handleSave() {
    setLoading(true)
    setError(null)
    const res = await updateWorkspace(ws.workspaceId, name.trim(), emoji, color)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setMode("view")
  }

  async function handleDelete() {
    setLoading(true)
    setError(null)
    const res = await deleteWorkspace(ws.workspaceId)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    // revalidatePath si occupa del refresh — il componente sparirà
  }

  return (
    <div className="glass-dashboard rounded-2xl overflow-hidden">

      {/* -- Vista normale ------------------------------------------------------- */}
      {mode === "view" && (
        <div className="flex items-center gap-4 px-5 py-4">
          <WorkspaceIcon ws={ws} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{ws.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.sessions} sessioni · {stats.events} eventi
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMode("edit")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-white/60 text-muted-foreground hover:text-foreground hover:bg-white transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setMode("delete")}
              disabled={isOnly}
              title={isOnly ? "Non puoi eliminare l'unico workspace" : undefined}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-white/60 text-muted-foreground hover:text-destructive hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* -- Vista edit ---------------------------------------------------------- */}
      {mode === "edit" && (
        <div className="px-5 py-4 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/40">
            <WorkspaceIcon ws={preview} size="lg" />
            <div>
              <p className="font-semibold text-foreground">{name || ws.label}</p>
              <p className="text-xs text-muted-foreground">Anteprima</p>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Emoji */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Icona</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(emoji === e ? null : e)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-base transition-colors border",
                    emoji === e
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/60 bg-white/60 hover:bg-muted"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Colore */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colore sfondo</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.hex)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all",
                    color === c.hex ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c.hex }}
                >
                  {color === c.hex && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Azioni */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setMode("view"); setName(ws.label); setEmoji(ws.emoji); setColor(ws.color ?? "#3B82F6") }}
              className="flex-1 rounded-lg border border-border py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </div>
      )}

      {/* -- Vista conferma eliminazione ----------------------------------------- */}
      {mode === "delete" && (
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Eliminare "{ws.label}"?</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Questa azione è <strong>irreversibile</strong>. Verranno eliminati:
              </p>
              <ul className="mt-1.5 text-sm text-muted-foreground space-y-0.5">
                <li>• <strong>{stats.sessions}</strong> sessioni</li>
                <li>• <strong>{stats.events}</strong> eventi calendario</li>
                <li>• I relativi link ai pagamenti</li>
              </ul>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setMode("view")}
              className="flex-1 rounded-lg border border-border py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 rounded-lg bg-destructive py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Eliminazione..." : "Elimina tutto"}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

// --- Form creazione nuovo workspace ---------------------------------------------

// Sentinel per indicare che l'utente vuole creare una categoria personalizzata
const CUSTOM_CAT = "__custom__"

function AddWorkspaceForm({
  allCategories,
  onDone,
}: {
  allCategories: WorkCategory[]
  onDone: () => void
}) {
  const [name,          setName]          = useState("")
  const [selectedCat,   setSelectedCat]   = useState<string>("")
  const [customLabel,   setCustomLabel]   = useState("")
  const [customDesc,    setCustomDesc]    = useState("")
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  const isCustom = selectedCat === CUSTOM_CAT

  async function handleCreate() {
    if (!name.trim() || !selectedCat) return
    setLoading(true)
    setError(null)

    let res: { error?: string }

    if (isCustom) {
      if (!customLabel.trim()) { setError("Inserisci il nome del tipo di lavoro"); setLoading(false); return }
      res = await createCategoryAndWorkspace(customLabel.trim(), customDesc.trim(), name.trim())
    } else {
      const cat = allCategories.find((c) => c.id === selectedCat)
      if (!cat) { setLoading(false); return }
      res = await addWorkspace(cat.id, name.trim())
    }

    setLoading(false)
    if (res.error) { setError(res.error); return }
    onDone()
  }

  return (
    <div className="glass-dashboard rounded-2xl px-5 py-4 space-y-4">
      {/* Header form */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Nuovo workspace</p>
        <button
          type="button"
          onClick={onDone}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Nome */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="es. Tutoring Marco"
          className="w-full rounded-lg border border-border bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
          autoFocus
        />
      </div>

      {/* Tipo di lavoro */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo di lavoro</label>
        <div className="space-y-1">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id === selectedCat ? "" : cat.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors border",
                selectedCat === cat.id
                  ? "border-primary/30 bg-primary/8 text-primary ring-1 ring-primary/20"
                  : "border-border/60 bg-white/40 hover:bg-muted text-foreground/80"
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-bold text-muted-foreground">
                {cat.label[0].toUpperCase()}
              </span>
              <span className="flex-1 text-left">{cat.label}</span>
              {selectedCat === cat.id && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </button>
          ))}

          {/* Opzione categoria personalizzata */}
          <button
            type="button"
            onClick={() => setSelectedCat(selectedCat === CUSTOM_CAT ? "" : CUSTOM_CAT)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors border",
              isCustom
                ? "border-amber-400/50 bg-amber-50/60 text-amber-800 ring-1 ring-amber-300/40"
                : "border-dashed border-border/60 bg-white/20 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-100 text-[11px]">
              ✏️
            </span>
            <span className="flex-1 text-left text-[13px]">Il tuo lavoro non è tra questi?</span>
            {isCustom && <Check className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
          </button>
        </div>
      </div>

      {/* Form categoria personalizzata */}
      {isCustom && (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50/50 px-4 py-3.5 space-y-3">
          {/* Warning */}
          <div className="flex items-start gap-2.5 text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">Attenzione:</span> la categoria che crei verrà aggiunta al database e sarà visibile a tutti gli utenti della piattaforma. Assicurati che il nome sia chiaro e rappresentativo.
            </p>
          </div>

          {/* Nome categoria */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              Nome del tipo di lavoro <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="es. Life Coaching, Fisioterapia…"
              className="w-full rounded-lg border border-amber-300/60 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/50"
            />
          </div>

          {/* Descrizione opzionale */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              Descrizione <span className="text-amber-400/70">(opzionale)</span>
            </label>
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Breve descrizione del tipo di lavoro…"
              className="w-full rounded-lg border border-amber-300/60 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/50"
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Crea button */}
      <button
        type="button"
        disabled={!name.trim() || !selectedCat || (isCustom && !customLabel.trim()) || loading}
        onClick={handleCreate}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Crea workspace
      </button>
    </div>
  )
}

// --- Componente principale ------------------------------------------------------

export function WorkspaceSettings({
  workspaces,
  stats,
  allCategories,
}: {
  workspaces: UserWorkspace[]
  stats: Record<string, { sessions: number; events: number }>
  allCategories: WorkCategory[]
}) {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="space-y-3">
      {workspaces.map((ws) => (
        <WorkspaceCard
          key={ws.workspaceId}
          ws={ws}
          stats={stats[ws.id] ?? { sessions: 0, events: 0 }}
          isOnly={workspaces.length === 1}
        />
      ))}

      {/* Form creazione / Pulsante aggiungi */}
      {showAddForm ? (
        <AddWorkspaceForm
          allCategories={allCategories}
          onDone={() => setShowAddForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/4 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Aggiungi workspace
        </button>
      )}
    </div>
  )
}
