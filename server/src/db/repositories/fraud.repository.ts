import { getPool } from "../pool.js";

export type VerificationTier = "auto_approved" | "soft_verify" | "held_for_review";

export interface FraudScoreRow {
    id: string;
    claim_id: string;
    user_id: string;
    bts_score: number;
    tier: VerificationTier;
    signals: Record<string, unknown>;
    ring_flagged: boolean;
    created_at: string;
}

export interface RingAlertRow {
    id: string;
    zone_id: string;
    detected_at: string;
    worker_count: number;
    claim_ids: string[];
    alert_type: "temporal_spike" | "amount_uniformity" | "referral_cluster";
    resolved: boolean;
    resolved_at: string | null;
    notes: string | null;
}

export const FraudRepository = {
    async insertFraudScore(score: Omit<FraudScoreRow, "created_at">): Promise<FraudScoreRow> {
        const pool = getPool();
        const { rows } = await pool.query<FraudScoreRow>(
            `INSERT INTO fraud_scores (id, claim_id, user_id, bts_score, tier, signals, ring_flagged)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [score.id, score.claim_id, score.user_id, score.bts_score,
             score.tier, JSON.stringify(score.signals), score.ring_flagged]
        );
        return rows[0]!;
    },

    async findScoreByClaimId(claimId: string): Promise<FraudScoreRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<FraudScoreRow>(
            `SELECT * FROM fraud_scores WHERE claim_id = $1`,
            [claimId]
        );
        return rows[0] ?? null;
    },

    async insertRingAlert(alert: Omit<RingAlertRow, "resolved" | "resolved_at" | "notes">): Promise<RingAlertRow> {
        const pool = getPool();
        const { rows } = await pool.query<RingAlertRow>(
            `INSERT INTO ring_alerts (id, zone_id, detected_at, worker_count, claim_ids, alert_type)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [alert.id, alert.zone_id, alert.detected_at, alert.worker_count,
             alert.claim_ids, alert.alert_type]
        );
        return rows[0]!;
    },

    async findRecentAlerts(limit: number = 20): Promise<RingAlertRow[]> {
        const pool = getPool();
        const { rows } = await pool.query<RingAlertRow>(
            `SELECT * FROM ring_alerts ORDER BY detected_at DESC LIMIT $1`,
            [limit]
        );
        return rows;
    },

    async findFraudStats(): Promise<{ total_scores: number; avg_bts: number; flagged_count: number; tier_counts: Record<string, number> }> {
        const pool = getPool();
        const { rows } = await pool.query<{ total_scores: string; avg_bts: string; flagged_count: string }>(
            `SELECT COUNT(*) as total_scores,
                    COALESCE(AVG(bts_score), 0) as avg_bts,
                    COUNT(*) FILTER (WHERE ring_flagged = true) as flagged_count
             FROM fraud_scores`
        );
        const { rows: tierRows } = await pool.query<{ tier: string; count: string }>(
            `SELECT tier, COUNT(*) as count FROM fraud_scores GROUP BY tier`
        );
        const tier_counts: Record<string, number> = {};
        for (const r of tierRows) {
            tier_counts[r.tier] = parseInt(r.count);
        }
        const row = rows[0];
        return {
            total_scores: parseInt(row?.total_scores ?? "0"),
            avg_bts: parseFloat(parseFloat(row?.avg_bts ?? "0").toFixed(1)),
            flagged_count: parseInt(row?.flagged_count ?? "0"),
            tier_counts,
        };
    },
};
