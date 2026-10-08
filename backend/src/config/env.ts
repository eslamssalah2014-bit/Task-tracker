import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val: string) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  SUPABASE_URL: z.string().default('https://demo-supabase.tasktracker.io'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('demo-service-role-key'),
  SUPABASE_ANON_KEY: z.string().default('demo-anon-key'),
  DEFAULT_TIMEZONE: z.string().default('Africa/Cairo'),
  DEFAULT_NO_UPDATE_THRESHOLD_DAYS: z.string().default('3').transform((val: string) => parseInt(val, 10)),
  EMAIL_PROVIDER: z.string().default('mock'),
  EMAIL_FROM: z.string().default('notifications@tasktracker.io'),
  AI_PROVIDER: z.string().default('mock'),
  RESEND_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
