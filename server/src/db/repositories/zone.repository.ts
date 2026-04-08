import { getPool } from "../pool.js";

export interface ZoneRow {
    id: string;
    name: string;
}

export const ZoneRepository = {
    async findAll(): Promise<ZoneRow[]> {
        const pool = getPool();
        const { rows } = await pool.query<ZoneRow>(`SELECT * FROM zones ORDER BY id`);
        return rows;
    },

    async findById(id: string): Promise<ZoneRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<ZoneRow>(
            `SELECT * FROM zones WHERE id = $1`,
            [id]
        );
        return rows[0] ?? null;
    },
};
