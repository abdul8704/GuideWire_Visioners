import { getPool } from "../pool.js";

export interface SessionRow {
    token: string;
    user_id: string;
    created_at: string;
}

export const SessionRepository = {
    async create(token: string, userId: string): Promise<SessionRow> {
        const pool = getPool();
        const { rows } = await pool.query<SessionRow>(
            `INSERT INTO sessions (token, user_id) VALUES ($1, $2) RETURNING *`,
            [token, userId]
        );
        return rows[0]!;
    },

    async findByToken(token: string): Promise<SessionRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<SessionRow>(
            `SELECT * FROM sessions WHERE token = $1`,
            [token]
        );
        return rows[0] ?? null;
    },

    async deleteByUserId(userId: string): Promise<void> {
        const pool = getPool();
        await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    },
};
