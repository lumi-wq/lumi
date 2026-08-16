/** Shared cookie / header names — safe for Edge middleware (no next/headers). */
export const GUEST_COOKIE = "lumi_guest";
/** Middleware → RSC/route: same guest id on the request that first sets the cookie. */
export const GUEST_HEADER = "x-lumi-guest-id";
