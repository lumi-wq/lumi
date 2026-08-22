import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GUEST_COOKIE, GUEST_HEADER } from "@/lib/guest-constants";

const GUEST_MAX_AGE = 60 * 60 * 24 * 365;

export function middleware(req: NextRequest) {
  let guestId = req.cookies.get(GUEST_COOKIE)?.value;
  const isNew = !guestId;
  if (!guestId) guestId = crypto.randomUUID();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(GUEST_HEADER, guestId);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (isNew) {
    res.cookies.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: GUEST_MAX_AGE,
      path: "/",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|media/|api/media/|api/admin/upload).*)"],
};
