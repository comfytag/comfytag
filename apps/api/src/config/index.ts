import { parseEnv, type ParsedEnv } from './env.js';

export type { ParsedEnv, NodeEnvironment, RawEnv } from './env.js';
export { EnvValidationError, parseEnv } from './env.js';

export interface AppConfig {
  app: {
    environment: ParsedEnv['nodeEnv'];
    port: number;
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
  };
  database: {
    mongoUri: string;
  };
  redis: {
    url: string;
  };
  logging: {
    level: ParsedEnv['logLevel'];
  };
  requestContext: {
    headerName: string;
  };
  rateLimit: {
    v1: {
      max: number;
      windowMs: number;
    };
  };
  commerce: {
    reservationHoldMinutes: number;
  };
  ticketing: {
    transferHoldHours: number;
  };
  reconciliation: {
    sweepIntervalMs: number;
    paymentStaleMs: number;
    payoutStaleMs: number;
    refundStaleMs: number;
  };
}

/**
 * Builds the typed, frozen configuration boundary for the new foundation.
 * Application/infrastructure code should depend on this shape — never on
 * `process.env` directly. Pass an explicit `source` in tests to avoid
 * touching real environment variables.
 */
export function createConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const env = parseEnv(source);

  const config: AppConfig = {
    app: {
      environment: env.nodeEnv,
      port: env.port,
      isProduction: env.nodeEnv === 'production',
      isDevelopment: env.nodeEnv === 'development',
      isTest: env.nodeEnv === 'test',
    },
    database: {
      mongoUri: env.mongoUri,
    },
    redis: {
      url: env.redisUrl,
    },
    logging: {
      level: env.logLevel,
    },
    requestContext: {
      headerName: env.requestIdHeader,
    },
    rateLimit: {
      v1: {
        max: env.rateLimit.max,
        windowMs: env.rateLimit.windowMs,
      },
    },
    commerce: {
      reservationHoldMinutes: env.reservationHoldMinutes,
    },
    ticketing: {
      transferHoldHours: env.transferHoldHours,
    },
    reconciliation: {
      sweepIntervalMs: env.reconciliationSweepIntervalMs,
      paymentStaleMs: env.paymentReconciliationStaleMs,
      payoutStaleMs: env.payoutReconciliationStaleMs,
      refundStaleMs: env.refundReconciliationStaleMs,
    },
  };

  return Object.freeze(config);
}

let cachedConfig: AppConfig | undefined;

/**
 * Memoized accessor for runtime call sites. Not evaluated at import time —
 * only when a caller actually needs configuration — so importing this
 * module never has side effects and never throws during test collection.
 */
export function getAppConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = createConfig();
  }
  return cachedConfig;
}

/** Test-only: clears the memoized singleton so tests can re-create it under a different env. */
export function resetAppConfigForTests(): void {
  cachedConfig = undefined;
}
