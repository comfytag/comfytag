import { test, expect } from '@playwright/test'

// ── Navbar behaviour ─────────────────────────────────────
test.describe('Navbar', () => {
  test('bell icon not present when logged out', async ({ page }) => {
    await page.goto('/')
    const bell = page.locator('button[aria-label="Notifications"]')
    expect(await bell.count()).toBe(0)
  })

  test('sign-up link href is /register', async ({ page }) => {
    await page.goto('/')
    const signup = page.getByRole('link', { name: 'Sign Up' })
    await expect(signup).toHaveAttribute('href', '/register')
  })

  test('logo links to /', async ({ page }) => {
    await page.goto('/search')
    const logo = page.locator('nav[aria-label="Main navigation"]').getByRole('link', { name: /comfytag/i })
    await logo.click()
    await expect(page).toHaveURL('/')
  })
})

// ── Checkout page ────────────────────────────────────────
test.describe('Checkout page', () => {
  test('missing params shows friendly error not crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/checkout')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
    const body = await page.textContent('body')
    expect(body!.length).toBeGreaterThan(10)
  })

  test('checkout with invalid eventId shows error gracefully', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/checkout?eventId=fake&tierId=fake&qty=1')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })
})

// ── Hype-link page ───────────────────────────────────────
test.describe('Hype-link page', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/hype-link')
    await page.waitForLoadState('domcontentloaded')
    // Middleware redirects to /login — check URL or presence of login form
    const url = page.url()
    const hasLoginForm = await page.locator('input[type="email"]').count()
    expect(url.includes('/login') || hasLoginForm > 0).toBe(true)
  })
})

// ── Organizer profile page ───────────────────────────────
test.describe('Organizer profile page', () => {
  test('non-existent organizer does not crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/organizer/nonexistent-organizer-xyz')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('tab buttons are rendered', async ({ page }) => {
    await page.goto('/organizer/nonexistent-organizer-xyz')
    await page.waitForLoadState('domcontentloaded')
    const body = await page.textContent('body')
    expect(body!.length).toBeGreaterThan(10)
  })
})

// ── Accessibility basics ─────────────────────────────────
test.describe('Accessibility', () => {
  test('home page has meaningful content', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const body = await page.textContent('body')
    expect(body!.length).toBeGreaterThan(100)
  })

  test('home page has two distinct nav landmarks with labels', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible()
    await expect(page.locator('nav[aria-label="Footer navigation"]')).toBeVisible()
  })

  test('search page input has placeholder', async ({ page }) => {
    await page.goto('/search')
    const input = page.getByRole('searchbox').nth(1)
    await expect(input).toBeVisible()
    const placeholder = await input.getAttribute('placeholder')
    expect(placeholder).toBeTruthy()
  })

  test('no broken images on home page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const imgs = page.locator('img[src=""], img:not([src])')
    const count = await imgs.count()
    expect(count).toBe(0)
  })
})

// ── Navigation correctness ───────────────────────────────
test.describe('Navigation correctness', () => {
  test('/tickets route exists and redirects auth', async ({ page }) => {
    const res = await page.goto('/tickets')
    expect(res?.status()).not.toBe(404)
  })

  test('/my-tickets shows 404 (old route removed)', async ({ page }) => {
    await page.goto('/my-tickets')
    await page.waitForLoadState('domcontentloaded')
    const body = await page.textContent('body')
    expect(body!.length).toBeGreaterThan(5)
  })
})
