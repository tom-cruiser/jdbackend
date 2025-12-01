const dns = require("dns").promises;
const config = require("../config");
const logger = require("../utils/logger");

// Require `pg` only when `DATABASE_URL` is present. This avoids a hard
// dependency on `pg` when the backend is running in MongoDB mode.
let Pool;
if (config.DATABASE_URL) {
  try {
    Pool = require('pg').Pool;
  } catch (err) {
    logger.warn('Postgres driver not available; DATABASE_URL is set but pg failed to load', err);
    throw err;
  }
}

// Build a Pool with a resolved host. Prefer IPv4 when available to avoid
// ENETUNREACH on environments without IPv6.
const buildPool = async () => {
  try {
    if (!config.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
    const url = new URL(config.DATABASE_URL);
    const originalHost = url.hostname;
    logger.debug(`Resolving database host ${originalHost}`);

    let ipv4 = [];
    let ipv6 = [];
    try {
      ipv4 = await dns.resolve4(originalHost);
    } catch (e) {
      logger.debug(`No A records for ${originalHost}: ${e.code || e.message}`);
    }
    try {
      ipv6 = await dns.resolve6(originalHost);
    } catch (e) {
      logger.debug(`No AAAA records for ${originalHost}: ${e.code || e.message}`);
    }

    let chosenHost = originalHost;
    if (ipv4.length > 0) {
      chosenHost = ipv4[0];
      logger.info(`Using IPv4 address ${chosenHost} for database host`);
    } else if (ipv6.length > 0) {
      chosenHost = ipv6[0];
      logger.info(`Using IPv6 address ${chosenHost} for database host`);
    } else {
      logger.warn(`No IP addresses found for ${originalHost}, using hostname`);
    }

    // Replace the host in the connection string when an IP was chosen
    if (chosenHost !== originalHost) {
      url.hostname = chosenHost;
    }

    const connectionString = url.toString();

    // For hosted DBs (like Supabase) enable SSL with rejectUnauthorized false
    // to allow connecting in dev where we don't validate cert chains.
    if (!Pool) throw new Error('Postgres Pool is not available');
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    // Attach a helpful error logger
    pool.on("error", (err) => {
      logger.error("Unexpected database error:", err);
    });

    return pool;
  } catch (err) {
    logger.error("Failed to build DB pool:", err);
    throw err;
  }
};

let pool;

const ensurePool = async () => {
  if (!pool) {
    pool = await buildPool();
  }
  return pool;
};

const testConnection = async () => {
  try {
    const p = await ensurePool();
    const client = await p.connect();
    logger.info("✅ Database connected successfully");
    client.release();
    return true;
  } catch (error) {
    logger.error("❌ Database connection failed:", error);
    return false;
  }
};

// Export a proxy `pool` object so existing modules can require it synchronously
// but the actual pool will be created lazily when first used.
const poolProxy = {
  query: async (text, params) => {
    const p = await ensurePool();
    return p.query(text, params);
  },
  connect: async () => {
    const p = await ensurePool();
    return p.connect();
  },
  on: (event, cb) => {
    // Attach event handler once pool is available
    ensurePool()
      .then((p) => p.on(event, cb))
      .catch((err) => logger.error('Failed to attach pool event handler', err));
  },
};

module.exports = {
  pool: poolProxy,
  testConnection,
  query: async (text, params) => {
    const p = await ensurePool();
    return p.query(text, params);
  },
};
