import { getPool } from "../pool.js";

export interface PolicyRow {
    id: string;
    user_id: string;
    zone_id: string;
    plan_id: string;
    premium_paid: number;
    max_weekly_payout: number;
    start_at: string;
    end_at: string;
    consumed_payout: number;
}

export const PolicyRepository = {
    async create(policy: Omit<PolicyRow, "consumed_payout">): Promise<PolicyRow> {
        const pool = getPool();
        const { rows } = await pool.query<PolicyRow>(
            `INSERT INTO policies (id, user_id, zone_id, plan_id, premium_paid, max_weekly_payout, start_at, end_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [policy.id, policy.user_id, policy.zone_id, policy.plan_id,
             policy.premium_paid, policy.max_weekly_payout, policy.start_at, policy.end_at]
        );
        return rows[0]!;
    },

    async findActiveByUserId(userId: string): Promise<PolicyRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<PolicyRow>(
            `SELECT * FROM policies
             WHERE user_id = $1 AND start_at <= NOW() AND end_at >= NOW()
             ORDER BY start_at DESC LIMIT 1`,
            [userId]
        );
        return rows[0] ?? null;
    },

    async findAllByUserId(userId: string): Promise<PolicyRow[]> {
        const pool = getPool();
        const { rows } = await pool.query<PolicyRow>(
            `SELECT * FROM policies WHERE user_id = $1 ORDER BY start_at DESC`,
            [userId]
        );
        return rows;
    },

    async updateConsumedPayout(policyId: string, amount: number): Promise<void> {
        const pool = getPool();
        await pool.query(
            `UPDATE policies SET consumed_payout = consumed_payout + $2 WHERE id = $1`,
            [policyId, amount]
        );
    },

    async countActive(): Promise<number> {
        const pool = getPool();
        const { rows } = await pool.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM policies WHERE start_at <= NOW() AND end_at >= NOW()`
        );
        return parseInt(rows[0]?.count ?? "0");
    },
};
