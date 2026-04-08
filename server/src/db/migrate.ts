import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPool, closePool } from "./pool.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    const pool = getPool();
    if (!pool) {
        console.error("❌ DATABASE_URL is not set. Cannot run migrations.");
        process.exit(1);
    }

    const migrationsDir = path.join(__dirname, "migrations");

    if (!fs.existsSync(migrationsDir)) {
        console.error(`❌ Migrations directory not found: ${migrationsDir}`);
        process.exit(1);
    }

    const sqlFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();

    if (sqlFiles.length === 0) {
        console.log("No migration files found.");
        await closePool();
        return;
    }

    console.log(`Found ${sqlFiles.length} migration file(s):\n`);

    for (const file of sqlFiles) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf-8");
        console.log(`▶ Running ${file}...`);
        try {
            await pool.query(sql);
            console.log(`  ✅ ${file} applied successfully.`);
        } catch (err) {
            console.error(`  ❌ ${file} failed:`, err instanceof Error ? err.message : err);
            await closePool();
            process.exit(1);
        }
    }

    console.log("\n✅ All migrations applied successfully.");
    await closePool();
}

migrate();
