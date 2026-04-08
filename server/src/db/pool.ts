import pg from "pg";
import logger from "../utils/logger.js";
import env from "../config/env.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

/**
 * Returns a singleton `pg.Pool` connected to the DATABASE_URL.
 */
export function getPool(): pg.Pool {
    if (!pool) {
        const useSsl =
            env.DATABASE_URL.includes("supabase.co") || env.DATABASE_URL.includes("sslmode=require");
        pool = new Pool({
            connectionString: env.DATABASE_URL,
            ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
            max: 10,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 10_000,
        });
        pool.on("error", (err: Error) => {
            logger.error("Unexpected PostgreSQL pool error", { err });
        });
    }
    return pool;
}

/** Quick health check; does not throw — logs and returns status. */
export async function verifyDbConnection(): Promise<{ ok: boolean; message: string }> {
    const p = getPool();
    let client: pg.PoolClient | undefined;
    try {
        client = await p.connect();
        await client.query("SELECT 1 AS ok");
        return { ok: true, message: "PostgreSQL connection OK" };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error("PostgreSQL connection failed", { err });
        return { ok: false, message };
    } finally {
        client?.release();
    }
}

export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

