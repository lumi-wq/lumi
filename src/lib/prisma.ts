import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  __lumiPrismaRev?: number;
};

/** Підвищуйте після змін схеми, щоб у dev скинути stale PrismaClient у HMR. */
const PRISMA_CLIENT_REV = 9;

if (globalForPrisma.__lumiPrismaRev !== PRISMA_CLIENT_REV) {
  void globalForPrisma.prisma?.$disconnect().catch(() => {});
  globalForPrisma.prisma = undefined;
  globalForPrisma.__lumiPrismaRev = PRISMA_CLIENT_REV;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
