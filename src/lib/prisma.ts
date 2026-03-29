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

/**
 * Max mtime of schema + generated client so dev discards cached `PrismaClient`
 * after `prisma generate` (new models under `models/*.ts`, not only `class.ts`).
 * Without this, new model delegates (etc.) can stay missing until a full dev restart.
 */
function prismaGeneratedMarkerMs(): number {
  const root = process.cwd();
  let max = 0;
  const bump = (filePath: string) => {
    try {
      max = Math.max(max, fs.statSync(filePath).mtimeMs);
    } catch {
      /* ignore */
    }
  };

  bump(path.join(root, "prisma/schema.prisma"));
  bump(path.join(root, "src/generated/prisma/client.ts"));
  bump(path.join(root, "src/generated/prisma/internal/class.ts"));

  try {
    const modelsDir = path.join(root, "src/generated/prisma/models");
    for (const name of fs.readdirSync(modelsDir)) {
      if (name.endsWith(".ts")) {
        bump(path.join(modelsDir, name));
      }
    }
  } catch {
    /* ignore */
  }

  return max;
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
