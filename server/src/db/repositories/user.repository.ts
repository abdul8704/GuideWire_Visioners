import { getPool } from "../pool.js";

export interface UserRow {
    id: string;
    name: string;
    email: string;
    phone: string;
    password_hash: string;
    zone_id: string;
    created_at: string;
}

export const UserRepository = {
    async create(user: Omit<UserRow, "created_at">): Promise<UserRow> {
        const pool = getPool();
        const { rows } = await pool.query<UserRow>(
            `INSERT INTO users (id, name, email, phone, password_hash, zone_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [user.id, user.name, user.email, user.phone, user.password_hash, user.zone_id]
        );
        return rows[0]!;
    },

    async findByEmail(email: string): Promise<UserRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<UserRow>(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );
        return rows[0] ?? null;
    },

    async findById(id: string): Promise<UserRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<UserRow>(
            `SELECT * FROM users WHERE id = $1`,
            [id]
        );
        return rows[0] ?? null;
    },

    async findByEmailOrPhone(email: string, phone: string): Promise<UserRow | null> {
        const pool = getPool();
        const { rows } = await pool.query<UserRow>(
            `SELECT * FROM users WHERE email = $1 OR phone = $2`,
            [email, phone]
        );
        return rows[0] ?? null;
    },
};
