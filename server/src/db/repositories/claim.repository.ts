import { getPool } from "../pool.js";
import type { HazardType } from "./trigger-event.repository.js";

export interface ClaimRow {
    id: string;
    user_id: string;
    policy_id: string;
    event_id: string;
    hazard_type: HazardType;
    intensity_factor_used: number;
    duration_factor_used: number;
    max_weekly_payout_snapshot: number;
    calculated_payout: number;
    created_at: string;
}

export const ClaimRepository = {
    async create(claim: Omit<ClaimRow, "created_at">): Promise<ClaimRow> {
        const pool = getPool();
        const { rows } = await pool.query<ClaimRow>(
            `INSERT INTO claims (id, user_id, policy_id, event_id, hazard_type,
             intensity_factor_used, duration_factor_used, max_weekly_payout_snapshot, calculated_payout)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [claim.id, claim.user_id, claim.policy_id, claim.event_id, claim.hazard_type,
             claim.intensity_factor_used, claim.duration_factor_used,
             claim.max_weekly_payout_snapshot, claim.calculated_payout]
        );
        return rows[0]!;
    },

    async findByUserId(userId: string): Promise<ClaimRow[]> {
        const pool = getPool();
        const { rows } = await pool.query<ClaimRow>(
            `SELECT * FROM claims WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    },

    async findById(id: string): Promise<ClaimRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<ClaimRow>(
            `SELECT * FROM claims WHERE id = $1`,
            [id]
        );
        return rows[0] ?? null;
    },

    async countRecentByZone(zoneId: string, withinMinutes: number = 3): Promise<{ count: number; claim_ids: string[] }> {
        const pool = getPool();
        const { rows } = await pool.query<{ count: string; claim_ids: string[] }>(
            `SELECT COUNT(*) as count, ARRAY_AGG(c.id) as claim_ids
             FROM claims c
             JOIN policies p ON c.policy_id = p.id
             WHERE p.zone_id = $1 AND c.created_at >= NOW() - INTERVAL '1 minute' * $2`,
            [zoneId, withinMinutes]
        );
        const row = rows[0];
        return {
            count: row ? parseInt(row.count) : 0,
            claim_ids: row?.claim_ids ?? [],
        };
    },

    async totalPayouts(): Promise<number> {
        const pool = getPool();
        const { rows } = await pool.query<{ total: string }>(
            `SELECT COALESCE(SUM(calculated_payout), 0) as total FROM claims`
        );
        return parseFloat(rows[0]?.total ?? "0");
    },

    async totalCount(): Promise<number> {
        const pool = getPool();
        const { rows } = await pool.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM claims`
        );
        return parseInt(rows[0]?.count ?? "0");
    },

    async findRecent(limit: number = 20): Promise<ClaimRow[]> {
        const pool = getPool();
        const { rows } = await pool.query<ClaimRow>(
            `SELECT * FROM claims ORDER BY created_at DESC LIMIT $1`,
            [limit]
        );
        return rows;
    },
};
