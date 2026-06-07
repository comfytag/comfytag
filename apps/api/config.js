/**
 * ComfyTag API Configuration
 * Single source of truth for environment-specific settings
 *
 * Separate configurations for dev vs prod:
 * - Dev: uses local MongoDB/Redis, localhost URLs
 * - Prod: uses external services, real domains
 */

export const config = {
  // Current environment
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',

  // Server port
  port: parseInt(process.env.PORT || '4002', 10),

  // Database configuration
  // Dev uses local MongoDB, Prod uses external MongoDB Atlas
  mongodb: {
    uri: process.env.NODE_ENV === 'development'
      ? process.env.MONGO                    // Local: mongodb://localhost:27018/...
      : process.env.MONGODB_URI,              // Prod: mongodb+srv://...
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // CORS configuration
  // Dev allows localhost, Prod allows real domains
  cors: {
    origins: process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
        ]
      : [
          process.env.WEB_URL,
          process.env.PARTNER_URL,
          process.env.ADMIN_URL,
        ].filter(Boolean),
  },

  // Feature flags - enable/disable per environment
  features: {
    emailQueue: process.env.NODE_ENV === 'production',
    notifications: process.env.NODE_ENV === 'production',
    analytics: true,
  },

  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET,
  },

  // External service keys
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
  },

  // Base URL for links in emails, etc.
  baseUrl: process.env.BASE_URL || 'https://comfytag.com',
}

// Prevent modifications to config after initialization
Object.freeze(config)

export default config
