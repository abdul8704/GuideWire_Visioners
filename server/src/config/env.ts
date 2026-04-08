import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
    PORT: z
        .string()
        .default("5000")
        .transform((val) => parseInt(val, 10)),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    OPENWEATHER_API_KEY: z.string().optional(),
    /** Supabase / Postgres — e.g. postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres */
    DATABASE_URL: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("❌ Invalid environment variables:", parsedEnv.error.issues);
    process.exit(1);
}

export default parsedEnv.data;
