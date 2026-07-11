import { test, expect } from '@playwright/test'

// ── Login ─────────────────────────────────────────────────
test.describe('Admin login page', () => {
  test('loads without crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Password').fill('WrongPassword123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  })
})

// ── Protected routes ──────────────────────────────────────
test.describe('Protected dashboard routes', () => {
  for (const route of ['/overview', '/users', '/organizers', '/events', '/payouts', '/kyc', '/settings']) {
    test(`${route} redirects unauthenticated user to /login`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      await expect(page).toHaveURL(/\/login/)
    })
  }
})
