import { getPool } from "../pool.js";

export interface WeatherRow {
    id: string;
    zone_id: string;
    observed_at: string;
    rainfall_mm_per_hr: number;
    temp_c: number;
    source_hash: string;
}

export const WeatherRepository = {
    async insert(row: WeatherRow): Promise<WeatherRow> {
        const pool = getPool();
        const { rows } = await pool.query<WeatherRow>(
            `INSERT INTO weather_time_series (id, zone_id, observed_at, rainfall_mm_per_hr, temp_c, source_hash)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [row.id, row.zone_id, row.observed_at, row.rainfall_mm_per_hr, row.temp_c, row.source_hash]
        );
        return rows[0]!;
    },

    async findLatestByZone(zoneId: string): Promise<WeatherRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<WeatherRow>(
            `SELECT * FROM weather_time_series WHERE zone_id = $1 ORDER BY observed_at DESC LIMIT 1`,
            [zoneId]
        );
        return rows[0] ?? null;
    },

    async findRecentByZone(zoneId: string, limit: number = 10): Promise<WeatherRow[]> {
        const pool = getPool();
        const { rows } = await pool.query<WeatherRow>(
            `SELECT * FROM weather_time_series WHERE zone_id = $1 ORDER BY observed_at DESC LIMIT $2`,
            [zoneId, limit]
        );
        return rows;
    },
};
