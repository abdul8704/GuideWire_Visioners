import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
    PORT: z
        .string()
        .default("5000")
        .transform((val) => parseInt(val, 10)),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    // console.error("❌ Invalid environment variables:", parsedEnv.error.format());
    console.error("❌ Invalid environment variables:", parsedEnv.error.issues)
    process.exit(1);
}

export default parsedEnv.data;
