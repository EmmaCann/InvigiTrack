import { readSmallBody } from "@/lib/clients/request-body"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { allowClientRequest, authorizePortal, portalCookie, sameOrigin, uuidPattern } from "@/lib/clients/access"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!sameOrigin(request) || !uuidPattern.test(id)) return new Response(null, { status: 403 })

  const secret = await readSmallBody(request, 43)
  if (!secret || secret.length !== 43) return new Response(null, { status: 400 })

  const db = createAdminClient()
  if (!db) return new Response(null, { status: 503 })
  const { count, error } = await db.from("clients").select("id", { count: "exact", head: true }).eq("id", id)
  if (error || !count) return new Response(null, { status: 403 })
  if (!await allowClientRequest(db, `access:${id}`, 30)) return new Response(null, { status: 429 })
  if (!await authorizePortal(id, secret)) return new Response(null, { status: 403 })

  const response = new NextResponse(null, { status: 204 })
  response.cookies.set(portalCookie(id), secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: `/clienti/${id}`,
  })
  return response
}
