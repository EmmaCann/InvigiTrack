import { NextResponse } from "next/server"
import { locationCookie, readLocationToken } from "@/lib/clients/location-access"
import { readSmallBody } from "@/lib/clients/request-body"

export async function POST(request: Request, { params }: { params: Promise<{ nome: string }> }) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response(null, { status: 403 })
  const { nome } = await params
  const token = await readSmallBody(request, 4096)
  if (!token || !(await readLocationToken(token, nome))) return new Response(null, { status: 403 })

  const response = new NextResponse(null, { status: 204 })
  response.cookies.set(locationCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: `/clienti/${encodeURIComponent(nome)}`,
  })
  return response
}
