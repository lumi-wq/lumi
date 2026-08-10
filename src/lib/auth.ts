import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "lumi_session";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "lumi-dev-secret");

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) return null;
  return user;
}
