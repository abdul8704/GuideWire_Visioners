import { getPool } from "../pool.js";

export interface PlanRow {
    id: string;
    code: "BASIC" | "STANDARD" | "PRO";
    weekly_premium: number;
    max_weekly_payout: number;
}

export const PlanRepository = {
    async findAll(): Promise<PlanRow[]> {
        const pool = getPool();
        const { rows } = await pool.query<PlanRow>(`SELECT * FROM plans ORDER BY weekly_premium`);
        return rows;
    },

    async findById(id: string): Promise<PlanRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<PlanRow>(
            `SELECT * FROM plans WHERE id = $1`,
            [id]
        );
        return rows[0] ?? null;
    },
};
