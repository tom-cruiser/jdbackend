const path = require("path");
const dotenv = require("dotenv");

// Always resolve .env from backend root so `node index.js` works from backend/src.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3001,
  DATABASE_URL: process.env.DATABASE_URL,
  MONGODB_URI: process.env.MONGODB_URI,
  // SUPABASE_URL: process.env.SUPABASE_URL,
  // SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,

  // Allow decoding JWTs in development without Supabase verification (dev only)
  ALLOW_DEV_JWT:
    typeof process.env.ALLOW_DEV_JWT !== "undefined"
      ? process.env.ALLOW_DEV_JWT === "true"
      : process.env.NODE_ENV === "development" && !!process.env.MONGODB_URI,

  // ImageKit configuration
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,

  // Frontend + email configuration
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  FROM_EMAIL: process.env.FROM_EMAIL || "noreply@example.com",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};

// Validate required environment variables
// If using MongoDB, DATABASE_URL is not required. Otherwise require DATABASE_URL.
const required = [
  // Either DATABASE_URL or MONGODB_URI must be present
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
];

if (!config.DATABASE_URL && !config.MONGODB_URI) {
  throw new Error(
    "Missing required environment variable: DATABASE_URL or MONGODB_URI"
  );
}

// If using Postgres, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.
if (config.DATABASE_URL) {
  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "DATABASE_URL is set, please also set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
}

// When using MongoDB (MONGODB_URI), SUPABASE keys are not required.
const requiredWhenAny = required.filter(
  (k) => k !== "SUPABASE_URL" && k !== "SUPABASE_SERVICE_ROLE_KEY"
);
for (const key of requiredWhenAny) {
  if (!config[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = config;
