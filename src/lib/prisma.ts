import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

/** When this file changes, `prisma generate` updates it — use mtime to detect stale clients. */
function prismaGeneratedMarkerMs(): number {
  try {
    const markerPath = path.join(
      process.cwd(),
      "src/generated/prisma/internal/class.ts",
    );
    return fs.statSync(markerPath).mtimeMs;
  } catch {
    return 0;
  }
}

let devClient: PrismaClient | undefined;
let devMarker = -1;

function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
  }

  const marker = prismaGeneratedMarkerMs();
  if (!devClient || devMarker !== marker) {
    devClient = createPrismaClient();
    devMarker = marker;
  }
  return devClient;
}

/**
 * In development, proxy so each use picks up a fresh client after `prisma generate`
 * (HMR can otherwise keep an old PrismaClient whose schema omits new fields).
 */
export const prisma =
  process.env.NODE_ENV === "production"
    ? getPrisma()
    : (new Proxy({} as PrismaClient, {
        get(_target, prop, _receiver) {
          const client = getPrisma();
          const value = Reflect.get(client, prop, client);
          if (typeof value === "function") {
            return value.bind(client);
          }
          return value;
        },
      }) as PrismaClient);
