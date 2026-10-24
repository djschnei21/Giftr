import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { giftrPool?: Pool };

const pool =
  globalForDb.giftrPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.VERCEL ? 5 : 10,
    idleTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.giftrPool = pool;
if (process.env.VERCEL) attachDatabasePool(pool);

export const db = drizzle(pool, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
