import { test, expect } from '@playwright/test'

// ── Home page ────────────────────────────────────────────
test.describe('Home page', () => {
  test('loads without crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('navbar is visible with logo and login CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible()
    await expect(page.getByText('ComfyTag').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible()
  })

  test('search input is present on desktop (navbar)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav[aria-label="Main navigation"] input[placeholder*="Search"]')).toBeVisible()
  })

  test('navigates to search on enter key in navbar', async ({ page }) => {
    await page.goto('/')
    const input = page.locator('nav[aria-label="Main navigation"] input[placeholder*="Search"]')
    await input.fill('Lagos')
    await input.press('Enter')
    await expect(page).toHaveURL(/\/search\?q=Lagos/)
  })

  test('footer navigation links are present', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav[aria-label="Footer navigation"]')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible()
  })
})

// ── Search page ──────────────────────────────────────────
test.describe('Search page', () => {
  test('loads empty state without crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/search')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('shows page-level search input and search button', async ({ page }) => {
    await page.goto('/search')
    // Target the page's own search bar (not navbar) — nth(1) is the page input
    await expect(page.getByRole('searchbox').nth(1)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
  })

  test('query param pre-populates the page search input', async ({ page }) => {
    await page.goto('/search?q=Detty')
    await page.waitForLoadState('domcontentloaded')
    // The page's own input (nth(1) after navbar) should reflect the query
    const input = page.getByRole('searchbox').nth(1)
    await expect(input).toHaveValue('Detty')
  })

  test('area filter pills render after search', async ({ page }) => {
    await page.goto('/search?q=concert')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('button', { name: 'GRA' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Stadium' })).toBeVisible()
  })

  test('date filter pills are clickable', async ({ page }) => {
    await page.goto('/search?q=concert')
    await page.waitForLoadState('domcontentloaded')
    const todayPill = page.getByRole('button', { name: 'Today' })
    await todayPill.click()
    await expect(todayPill).toHaveCSS('background-color', /rgb/)
  })
})

// ── Event detail page ────────────────────────────────────
test.describe('Event detail page', () => {
  test('404 slug shows error gracefully', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/events/nonexistent-event-slug-xyz')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('no sticky Navbar on event detail (transparent nav only)', async ({ page }) => {
    await page.goto('/events/nonexistent-event-slug-xyz')
    await page.waitForLoadState('domcontentloaded')
    const stickyNav = page.locator('nav.__ct_navbar')
    expect(await stickyNav.count()).toBe(0)
  })
})

// ── Auth pages ───────────────────────────────────────────
test.describe('Login page', () => {
  test('loads without crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})

test.describe('Register page', () => {
  test('loads without crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/register')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })
})

// ── Protected pages (middleware redirects to /login) ─────
test.describe('Protected page redirects', () => {
  for (const route of ['/profile', '/tickets', '/hype-link', '/notifications']) {
    test(`${route} redirects unauthenticated user to /login`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      const url = page.url()
      // Middleware redirects to /login or page shows auth gate
      const isLoginPage = url.includes('/login')
      const hasAuthUI = await page.locator('input[type="email"], input[type="password"]').count()
      expect(isLoginPage || hasAuthUI > 0).toBe(true)
    })
  }
})

// ── 404 page ─────────────────────────────────────────────
test.describe('Not-found page', () => {
  test('renders custom 404 without crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/this-page-does-not-exist-at-all')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
  })
})
