import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** P2P modules (PR / PO / GR / AP / payments) are out of Bid V1 scope. */
const P2P = /^\/(demandes|commandes|receptions|factures|paiements)(\/|$)/;

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (P2P.test(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  // Legacy workbench list — one RFQ list lives on the dashboard.
  if (pathname === "/appels-offres" || pathname === "/appels-offres/") {
    const id = searchParams.get("id");
    if (id) {
      const dest = new URL(`/appels-offres/${id}`, request.url);
      const tab = searchParams.get("tab");
      if (tab) dest.searchParams.set("tab", tab);
      return NextResponse.redirect(dest);
    }
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/demandes/:path*",
    "/commandes/:path*",
    "/receptions/:path*",
    "/factures/:path*",
    "/paiements/:path*",
    "/appels-offres",
  ],
};
