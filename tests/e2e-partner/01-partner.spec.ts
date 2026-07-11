import { test, expect } from '@playwright/test'

// ── Login ─────────────────────────────────────────────────
test.describe('Partner login page', () => {
  test('loads without crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email address').fill('wrong@example.com')
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword123!')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  })

  test('"Create one" link goes to register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Create one' }).click()
    await expect(page).toHaveURL(/\/register/)
  })
})

// ── Registration ──────────────────────────────────────────
test.describe('Partner register page', () => {
  test('loads without crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/register')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('renders all fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel('Full Name')).toBeVisible()
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirm Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('shows validation error on weak password', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Full Name').fill('New Partner')
    await page.getByLabel('Username').fill('newpartner')
    await page.getByLabel('Email address').fill('newpartner@example.com')
    await page.getByLabel('Password', { exact: true }).fill('weak')
    await page.getByLabel('Confirm Password').fill('weak')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible()
  })

  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Full Name').fill('New Partner')
    await page.getByLabel('Username').fill('newpartner')
    await page.getByLabel('Email address').fill('newpartner@example.com')
    await page.getByLabel('Password', { exact: true }).fill('StrongPass123!')
    await page.getByLabel('Confirm Password').fill('DifferentPass123!')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })
})

// ── Protected routes ──────────────────────────────────────
test.describe('Protected dashboard routes', () => {
  for (const route of ['/overview', '/events', '/settings', '/withdraw']) {
    test(`${route} redirects unauthenticated user to /login`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      await expect(page).toHaveURL(/\/login/)
    })
  }
})
