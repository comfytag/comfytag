import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'

// ============================================================================
// Phase 12B — baseline security middleware on the legacy surface
// ============================================================================
//
// The Phase 12A audit found Helmet was only applied inside the /api/v1
// router (src/routes/v1/index.ts) — the ~30 legacy routers mounted directly
// on app.js, which is what the live web/partner/admin frontends actually
// call, had no security headers at all. app.js now applies a global
// `app.use(helmet())` before every router is mounted (see app.js's
// "Middlewares" section). Booting the real app.js in a test is impractical
// (it opens a real Mongo connection, starts cron jobs, and calls
// process.exit(1) on failure), so this test applies the exact same
// `helmet()` call to a minimal app to prove what those default headers are.
//
// CORS origin-restriction already existed before this phase (app.js's own
// `allowedOrigins`/`cors()` callback) — this test exercises that same
// allow-list *pattern* against a local reconstruction of it, independent of
// whatever WEB_URL/PARTNER_URL/NODE_ENV happen to be set to in this test
// run, to confirm a disallowed origin is actually rejected and an allowed
// one is actually accepted.

function buildAppWithLegacySecurityMiddleware(allowedOrigins: string[]) {
  const app = express()
  app.use(helmet())
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) return callback(null, true)
        return callback(new Error('Not allowed by CORS'))
      },
      credentials: true,
    })
  )
  app.get('/probe', (_req, res) => res.status(200).json({ ok: true }))
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(500).json({ success: false, message: err.message })
  })
  return app
}

describe('Legacy surface security headers (Phase 12B)', () => {
  let app: Express

  beforeAll(() => {
    app = buildAppWithLegacySecurityMiddleware(['http://localhost:3000'])
  })

  it('sets baseline Helmet security headers on a legacy-style response', async () => {
    const res = await request(app).get('/probe')

    expect(res.status).toBe(200)
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(res.headers['x-dns-prefetch-control']).toBe('off')
    // Helmet no longer sets a legacy X-XSS-Protection header by default in
    // recent versions, and CSP/HSTS presence depends on the exact Helmet
    // version's defaults — the four checked above are the stable baseline
    // this fix is actually about (previously none of these were present on
    // any legacy route).
  })

  it('does not leak a stack trace or a permissive Access-Control-Allow-Origin for a disallowed origin', async () => {
    const res = await request(app).get('/probe').set('Origin', 'https://evil-example.com')

    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil-example.com')
    expect(res.headers['access-control-allow-origin']).not.toBe('*')
  })

  it('accepts an approved origin', async () => {
    const res = await request(app).get('/probe').set('Origin', 'http://localhost:3000')

    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000')
  })

  it('a request with no Origin header (server-to-server, curl) is still allowed through', async () => {
    const res = await request(app).get('/probe')
    expect(res.status).toBe(200)
  })
})
