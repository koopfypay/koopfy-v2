// middleware.ts
import { NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // CRM — verificação feita no client (crm-layout.tsx) via localStorage
  // Middleware não tem acesso ao localStorage, então não interferimos aqui
  if (pathname.startsWith("/crm")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}