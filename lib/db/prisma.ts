import { PrismaClient } from "@prisma/client";

/**
 * Singleton mis en cache sur l'objet global : sans cela, le rechargement à
 * chaud de Next.js crée un nouveau client à chaque modification et épuise
 * le pool de connexions de la base.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Le site fonctionne sans base : les routes API le vérifient avant tout. */
export const dbConfiguree = Boolean(process.env.DATABASE_URL);
