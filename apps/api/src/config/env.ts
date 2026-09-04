import Joi from 'joi';

/**
 * Raw environment schema for the new foundation.
 *
 * This is intentionally scoped to what the foundation itself consumes.
 * It does NOT replace `apps/api/startup.js` (`validateEnvironment`), which
 * remains the authority for legacy-required variables (PORT, JWT_SECRET,
 * Mongo/Redis in dev, the full production checklist, etc). By the time this
 * module is ever exercised inside the running app, `startup.js` has already
 * run and guaranteed those core variables exist — this schema re-validates
 * the subset the foundation cares about, with its own typed shape, so new
 * code never reads `process.env` directly.
 */
export interface RawEnv {
  NODE_ENV?: string;
  PORT?: string;
  MONGODB_URI?: string;
  MONGO?: string;
  REDIS_URL?: string;
  LOG_LEVEL?: string;
  REQUEST_ID_HEADER?: string;
  RATE_LIMIT_V1_MAX?: string;
  RATE_LIMIT_V1_WINDOW_MS?: string;
  RESERVATION_HOLD_MINUTES?: string;
  TRANSFER_HOLD_HOURS?: string;
  RECONCILIATION_SWEEP_INTERVAL_MS?: string;
  PAYMENT_RECONCILIATION_STALE_MS?: string;
  PAYOUT_RECONCILIATION_STALE_MS?: string;
  REFUND_RECONCILIATION_STALE_MS?: string;
}

export type NodeEnvironment = 'development' | 'test' | 'production';

export interface ParsedEnv {
  nodeEnv: NodeEnvironment;
  port: number;
  mongoUri: string;
  redisUrl: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  requestIdHeader: string;
  rateLimit: {
    max: number;
    windowMs: number;
  };
  /**
   * Phase 4B — how long an ACTIVE reservation holds inventory before it's
   * treated as expired. No business-approved value exists in any prior
   * phase's documentation; 10 minutes is a common e-commerce default used
   * here as a documented development default, not a confirmed business
   * decision — see docs/backend/PHASE_4B_RESERVATION_ORDER_COMMERCE.md.
   */
  reservationHoldMinutes: number;
  /**
   * Phase 6B — how long a PENDING TicketTransfer stays open before it is
   * lazily treated as EXPIRED (same "no approved business value, documented
   * development default" status as `reservationHoldMinutes`). 48 hours is a
   * common transfer-offer window used here as a placeholder, not a
   * confirmed business decision — see the Phase 6B implementation report.
   */
  transferHoldHours: number;
  /**
   * Phase 9 — how often the reconciliation worker sweeps for stale
   * payment/payout attempts, and how old an INITIATED/UNKNOWN attempt must
   * be before the sweep re-verifies it. Same "no approved business value,
   * documented development default" status as `reservationHoldMinutes`.
   */
  reconciliationSweepIntervalMs: number;
  paymentReconciliationStaleMs: number;
  payoutReconciliationStaleMs: number;
  /** Phase 10 — same "documented development default" status; how old an INITIATED/UNKNOWN RefundAttempt must be before the sweep re-verifies it. */
  refundReconciliationStaleMs: number;
}

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.string().pattern(/^\d+$/).default('4002'),
  MONGODB_URI: Joi.string().uri().optional(),
  MONGO: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).optional(),
  REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').optional(),
  REQUEST_ID_HEADER: Joi.string().default('x-request-id'),
  RATE_LIMIT_V1_MAX: Joi.string().pattern(/^\d+$/).default('300'),
  RATE_LIMIT_V1_WINDOW_MS: Joi.string().pattern(/^\d+$/).default('60000'),
  RESERVATION_HOLD_MINUTES: Joi.string().pattern(/^\d+$/).default('10'),
  TRANSFER_HOLD_HOURS: Joi.string().pattern(/^\d+$/).default('48'),
  RECONCILIATION_SWEEP_INTERVAL_MS: Joi.string().pattern(/^\d+$/).default('300000'),
  PAYMENT_RECONCILIATION_STALE_MS: Joi.string().pattern(/^\d+$/).default('300000'),
  PAYOUT_RECONCILIATION_STALE_MS: Joi.string().pattern(/^\d+$/).default('600000'),
  REFUND_RECONCILIATION_STALE_MS: Joi.string().pattern(/^\d+$/).default('600000'),
})
  .or('MONGODB_URI', 'MONGO')
  .unknown(true);

export class EnvValidationError extends Error {
  constructor(public readonly details: string[]) {
    super(`Environment validation failed:\n${details.map((d) => `  - ${d}`).join('\n')}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Parses and validates a raw environment source into a typed, frozen shape.
 * Pure function — takes the source explicitly so tests can supply a
 * controlled environment without mutating `process.env` or reading real
 * development secrets.
 */
export function parseEnv(source: NodeJS.ProcessEnv = process.env): ParsedEnv {
  const { value, error } = schema.validate(source, { abortEarly: false, stripUnknown: false });

  if (error) {
    throw new EnvValidationError(error.details.map((d) => d.message));
  }

  const nodeEnv = value.NODE_ENV as NodeEnvironment;
  const mongoUri: string | undefined = value.MONGODB_URI || value.MONGO;

  if (!mongoUri) {
    throw new EnvValidationError(['One of MONGODB_URI or MONGO must be set']);
  }

  const defaultLogLevel = nodeEnv === 'production' ? 'warn' : 'debug';

  const parsed: ParsedEnv = {
    nodeEnv,
    port: parseInt(value.PORT, 10),
    mongoUri,
    redisUrl: value.REDIS_URL,
    logLevel: value.LOG_LEVEL ?? defaultLogLevel,
    requestIdHeader: value.REQUEST_ID_HEADER.toLowerCase(),
    rateLimit: {
      max: parseInt(value.RATE_LIMIT_V1_MAX, 10),
      windowMs: parseInt(value.RATE_LIMIT_V1_WINDOW_MS, 10),
    },
    reservationHoldMinutes: parseInt(value.RESERVATION_HOLD_MINUTES, 10),
    transferHoldHours: parseInt(value.TRANSFER_HOLD_HOURS, 10),
    reconciliationSweepIntervalMs: parseInt(value.RECONCILIATION_SWEEP_INTERVAL_MS, 10),
    paymentReconciliationStaleMs: parseInt(value.PAYMENT_RECONCILIATION_STALE_MS, 10),
    payoutReconciliationStaleMs: parseInt(value.PAYOUT_RECONCILIATION_STALE_MS, 10),
    refundReconciliationStaleMs: parseInt(value.REFUND_RECONCILIATION_STALE_MS, 10),
  };

  return Object.freeze(parsed);
}
