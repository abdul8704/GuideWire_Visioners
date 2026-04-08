import { getPool } from "../pool.js";

export type HazardType = "rainfall" | "heatwave";
export type EventStatus = "open" | "closed";

export interface TriggerEventRow {
    id: string;
    zone_id: string;
    hazard_type: HazardType;
    event_start_at: string;
    event_end_at: string | null;
    duration_minutes: number | null;
    peak_intensity: number;
    event_status: EventStatus;
    last_breach_at: string;
}

export const TriggerEventRepository = {
    async create(event: TriggerEventRow): Promise<TriggerEventRow> {
        const pool = getPool();
        const { rows } = await pool.query<TriggerEventRow>(
            `INSERT INTO trigger_events (id, zone_id, hazard_type, event_start_at, event_end_at, duration_minutes, peak_intensity, event_status, last_breach_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [event.id, event.zone_id, event.hazard_type, event.event_start_at,
             event.event_end_at, event.duration_minutes, event.peak_intensity,
             event.event_status, event.last_breach_at]
        );
        return rows[0]!;
    },

    async findOpenByZoneAndHazard(zoneId: string, hazardType: HazardType): Promise<TriggerEventRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<TriggerEventRow>(
            `SELECT * FROM trigger_events
             WHERE zone_id = $1 AND hazard_type = $2 AND event_status = 'open'
             LIMIT 1`,
            [zoneId, hazardType]
        );
        return rows[0] ?? null;
    },

    async updateBreach(eventId: string, lastBreachAt: string, peakIntensity: number): Promise<void> {
        const pool = getPool();
        await pool.query(
            `UPDATE trigger_events
             SET last_breach_at = $2, peak_intensity = GREATEST(peak_intensity, $3)
             WHERE id = $1`,
            [eventId, lastBreachAt, peakIntensity]
        );
    },

    async closeEvent(eventId: string, eventEndAt: string, durationMinutes: number): Promise<void> {
        const pool = getPool();
        await pool.query(
            `UPDATE trigger_events
             SET event_status = 'closed', event_end_at = $2, duration_minutes = $3
             WHERE id = $1`,
            [eventId, eventEndAt, durationMinutes]
        );
    },

    async findLatestClosedByZoneAndHazard(zoneId: string, hazardType: HazardType): Promise<TriggerEventRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<TriggerEventRow>(
            `SELECT * FROM trigger_events
             WHERE zone_id = $1 AND hazard_type = $2 AND event_status = 'closed'
             ORDER BY event_end_at DESC LIMIT 1`,
            [zoneId, hazardType]
        );
        return rows[0] ?? null;
    },

    async findRecentByZone(zoneId: string, limit: number = 5): Promise<TriggerEventRow[]> {
        const pool = getPool();
        const { rows } = await pool.query<TriggerEventRow>(
            `SELECT * FROM trigger_events
             WHERE zone_id = $1
             ORDER BY event_start_at DESC LIMIT $2`,
            [zoneId, limit]
        );
        return rows;
    },

    async findAll(): Promise<TriggerEventRow[]> {
        const pool = getPool();
        const { rows } = await pool.query<TriggerEventRow>(
            `SELECT * FROM trigger_events ORDER BY event_start_at DESC LIMIT 50`
        );
        return rows;
    },
};
