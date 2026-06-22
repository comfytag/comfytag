/**
 * ComfyTag API Startup Validation
 * Validates all required environment variables before app starts
 *
 * Purpose: Fail fast with clear error messages instead of cryptic runtime errors
 */

export async function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development'
  const errors = []

  console.log(`\n🚀 ComfyTag API Startup`)
  console.log(`   Environment: ${env}`)

  // ========== REQUIRED IN ALL ENVIRONMENTS ==========
  const required = ['PORT', 'JWT_SECRET']

  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required env var: ${key}`)
    }
  }

  // ========== DEVELOPMENT ONLY ==========
  if (env === 'development' || !env) {
    const devRequired = ['MONGO', 'REDIS_URL']

    for (const key of devRequired) {
      if (!process.env[key]) {
        errors.push(`Missing development env var: ${key}`)
      }
    }

    // Dev can use localhost defaults
    if (!process.env.WEB_URL) process.env.WEB_URL = 'http://localhost:3000'
    if (!process.env.PARTNER_URL) process.env.PARTNER_URL = 'http://localhost:3001'
    if (!process.env.ADMIN_URL) process.env.ADMIN_URL = 'http://localhost:3002'

    // For dev, accept MONGO variable name
    if (!process.env.MONGODB_URI && process.env.MONGO) {
      process.env.MONGODB_URI = process.env.MONGO
    }
  }

  // ========== PRODUCTION ONLY ==========
  if (env === 'production') {
    const prodRequired = [
      'MONGO',  // Accept MONGO for MongoDB URI
      'REDIS_URL',
      'WEB_URL',
      'PARTNER_URL',
      'ADMIN_URL',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'AWS_ACCESS_KEY_ID',       // AWS SES credentials
      'AWS_SECRET_ACCESS_KEY',
      'SES_SENDER_EMAIL',
    ]

    for (const key of prodRequired) {
      if (!process.env[key]) {
        errors.push(`Missing production env var: ${key}`)
      }
    }

    // Normalize: copy MONGO to MONGODB_URI for consistency
    if (!process.env.MONGODB_URI && process.env.MONGO) {
      process.env.MONGODB_URI = process.env.MONGO
    }
  }

  // ========== VALIDATION RESULT ==========
  if (errors.length > 0) {
    console.error(`\n❌ Environment validation FAILED:\n`)
    errors.forEach((err) => {
      console.error(`   ❌ ${err}`)
    })
    console.error(`\n📋 Fix missing env vars in .env file and restart\n`)
    process.exit(1)
  }

  console.log(`✅ Environment validation passed`)
  console.log(`   Database: ${env === 'development' ? 'Local MongoDB' : 'External (Atlas/managed)'}`)
  console.log(`   CORS Origins: ${[process.env.WEB_URL, process.env.PARTNER_URL, process.env.ADMIN_URL].filter(Boolean).join(', ')}`)
  console.log(``)
}

export default validateEnvironment
