import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  SCHOLARXIV_API_KEY: z.string().optional(),
  OPENALEX_MAILTO: z.string().optional(),
  NEXT_PUBLIC_VOXIDE_PUBLIC_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (!parsedEnv) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const formatted = result.error.format();
      console.error("Environment validation failed:", formatted);
      throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
    }
    parsedEnv = result.data;
  }
  return parsedEnv;
}
