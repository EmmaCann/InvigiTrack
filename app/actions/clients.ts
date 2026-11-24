"use server"

import { revalidatePath } from "next/cache"
import { handleClientUpload, uploadInput } from "@/lib/clients/files"
import { getClientManager, managedClient, newSecret, secretHash, uuidPattern } from "@/lib/clients/access"

const denied = { error: "Operazione non disponibile per questo workspace." }
const failed = { error: "Salvataggio non riuscito. Riprova." }

function refresh() {
  revalidatePath("/dashboard", "layout")
}

export async function setClientsEnabled(workspaceId: string, enabled: boolean) {
  const manager = await getClientManager(false)
  if (!manager || manager.workspaceId !== workspaceId || typeof enabled !== "boolean") return denied
  const { error } = await manager.db.rpc("set_client_workspace_enabled", {
    p_workspace: workspaceId, p_user: manager.userId, p_enabled: enabled,
  })
  if (error) return failed
  refresh()
  return {}
}

export async function saveClient(workspaceId: string, name: string, id?: string): Promise<{ error?: string; id?: string }> {
  const manager = await getClientManager()
  if (!manager || manager.workspaceId !== workspaceId || (id !== undefined && !uuidPattern.test(id))) return denied
  if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 120) {
    return { error: "Inserisci un nome di massimo 120 caratteri." }
  }
  const table = manager.db.from("clients")
  const query = id
    ? table.update({ name: name.trim() }).eq("id", id).eq("user_id", manager.userId).eq("workspace_id", workspaceId)
    : table.insert({ user_id: manager.userId, workspace_id: workspaceId, name: name.trim() })
  const { data, error } = await query.select("id").single()
  if (error) return failed
  refresh()
  return { id: data.id as string }
}

export async function changeClientAccess(workspaceId: string, id: string, action: "generate" | "revoke" | "disable" | "enable"): Promise<{ error?: string; fragment?: string }> {
  const manager = await getClientManager()
  if (!manager || manager.workspaceId !== workspaceId) return denied
  const client = await managedClient(manager, id)
  if (!client) return denied

  if (action === "generate" && !client.disabled_at) {
    const secret = newSecret()
    const { error } = await manager.db.rpc("generate_client_link", {
      p_client: id, p_user: manager.userId, p_workspace: workspaceId, p_hash: secretHash(secret),
    })
    if (error) return failed
    refresh()
    return { fragment: `/clienti/${id}#${secret}` }
  }
  if (action === "revoke") {
    const { error } = await manager.db.from("client_links").delete().eq("client_id", id)
    if (error) return failed
  } else if (action === "disable" || action === "enable") {
    const { error } = await manager.db.rpc("set_client_disabled", {
      p_client: id, p_user: manager.userId, p_workspace: workspaceId, p_disabled: action === "disable",
    })
    if (error) return failed
  } else {
    return denied
  }
  refresh()
  return {}
}

export async function associateClientHistory(workspaceId: string, id: string, form: FormData) {
  const manager = await getClientManager()
  if (!manager || manager.workspaceId !== workspaceId) return denied
  const sessions = form.getAll("sessions")
  const events = form.getAll("events")
  const ids = [...sessions, ...events]
  if (ids.length < 1 || ids.length > 250 || ids.some((value) => typeof value !== "string" || !uuidPattern.test(value))) {
    return { error: "Seleziona da 1 a 250 voci." }
  }
  const { error } = await manager.db.rpc("associate_client_history", {
    p_client: id, p_user: manager.userId, p_workspace: workspaceId, p_sessions: sessions, p_events: events,
  })
  if (error) return { error: "Le voci selezionate sono cambiate. Aggiorna la pagina e riprova." }
  refresh()
  return {}
}

export async function saveClientLesson(workspaceId: string, id: string, source: string, event: boolean, form: FormData) {
  const manager = await getClientManager()
  if (!manager || manager.workspaceId !== workspaceId || !uuidPattern.test(id) || !uuidPattern.test(source)) return denied
  const [title, topics, description] = ["title", "topics", "description"].map((key) => form.get(key))
  if (typeof title !== "string" || typeof topics !== "string" || typeof description !== "string"
    || title.length > 160 || topics.length > 2000 || description.length > 6000) return failed
  const { error } = await manager.db.rpc("save_client_lesson", {
    p_user: manager.userId, p_workspace: workspaceId, p_client: id, p_source: source, p_event: event,
    p_title: title.trim(), p_topics: topics.trim(), p_description: description.trim(), p_published: form.has("published"),
  })
  if (error) return failed
  refresh()
  return {}
}

export async function saveClientTask(workspaceId: string, id: string, lesson: string, taskId: string | null, form: FormData) {
  const manager = await getClientManager()
  if (!manager || manager.workspaceId !== workspaceId || !uuidPattern.test(lesson) || (taskId && !uuidPattern.test(taskId))) return denied
  const client = await managedClient(manager, id)
  if (!client || client.disabled_at) return denied
  const { db, userId } = manager
  const { data: allowed } = await db.rpc("client_upload_allowed", {
    p_client: id, p_kind: "material", p_target: lesson, p_owner: userId, p_workspace: workspaceId, p_hash: null,
  })
  if (!allowed) return denied
  const title = String(form.get("title") ?? "").trim()
  const instructions = String(form.get("instructions") ?? "").trim()
  const due = String(form.get("due") ?? "")
  if (!title || title.length > 160 || instructions.length > 6000 || (due && !/^\d{4}-\d{2}-\d{2}$/.test(due))) return failed
  const patch = { title, instructions, due_date: due || null, published: form.has("published") }
  const table = db.from("client_tasks")
  const query = taskId ? table.update(patch).eq("id", taskId).eq("lesson_id", lesson) : table.insert({ ...patch, lesson_id: lesson })
  const { error } = await query.select("id").single()
  if (error) return failed
  refresh()
  return {}
}

export async function uploadClientMaterial(workspaceId: string, id: string, kind: "material" | "attachment", payload: unknown) {
  const manager = await getClientManager()
  if (!manager || manager.workspaceId !== workspaceId || !uuidPattern.test(id) || !["material", "attachment"].includes(kind)) return denied
  const input = uploadInput.safeParse(payload)
  if (!input.success) return { error: "Seleziona fino a 5 file, massimo 20 MB ciascuno." }
  const result = await handleClientUpload({ db: manager.db, id, owner: manager.userId, workspace: workspaceId }, kind, input.data)
  if (result.confirmed) refresh()
  return result
}
