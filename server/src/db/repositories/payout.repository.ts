import { getPool } from "../pool.js";

export interface PayoutRow {
    id: string;
    claim_id: string;
    policy_id: string;
    amount: number;
    status: "calculated" | "finalized";
    created_at: string;
}

export const PayoutRepository = {
    async create(payout: Omit<PayoutRow, "created_at">): Promise<PayoutRow> {
        const pool = getPool();
        const { rows } = await pool.query<PayoutRow>(
            `INSERT INTO payout_ledger (id, claim_id, policy_id, amount, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [payout.id, payout.claim_id, payout.policy_id, payout.amount, payout.status]
        );
        return rows[0]!;
    },

    async findByClaimId(claimId: string): Promise<PayoutRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<PayoutRow>(
            `SELECT * FROM payout_ledger WHERE claim_id = $1`,
            [claimId]
        );
        return rows[0] ?? null;
    },

    async updateStatus(id: string, status: "calculated" | "finalized"): Promise<void> {
        const pool = getPool();
        await pool.query(
            `UPDATE payout_ledger SET status = $2 WHERE id = $1`,
            [id, status]
        );
    },

    async totalFinalized(): Promise<number> {
        const pool = getPool();
        const { rows } = await pool.query<{ total: string }>(
            `SELECT COALESCE(SUM(amount), 0) as total FROM payout_ledger WHERE status = 'finalized'`
        );
        return parseFloat(rows[0]?.total ?? "0");
    },
};
