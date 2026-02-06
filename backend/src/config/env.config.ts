// backend/src/config/env.config.ts
import dotenv from 'dotenv';
import { z } from 'zod';
import { Secret } from 'jsonwebtoken';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('8080'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  JWT_SECRET: z.string() as z.ZodType<Secret>,
  JWT_EXPIRES_IN: z.union([z.string(), z.number()]).default('7d'),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  FRONTEND_URL: z.string(),
  SMTP_PASSWORD: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string(),
  SMTP_FROM: z.string(),
  RECAPTCHA_SECRET_KEY: z.string(),
  RECAPTCHA_SITE_KEY: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  NEXT_AWS_BUCKET_NAME: z.string(),
  ANTHROPIC_API_KEY: z.string({
    required_error: 'Klucz API Anthropic jest wymagany',
  }),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error('❌ Nieprawidłowa konfiguracja zmiennych środowiskowych:');
  console.error(envParse.error.format());
  process.exit(1);
}

export const env = envParse.data;
