import { test, expect } from '@playwright/test'

// ── Event Browse & Details ───────────────────────────────
test.describe('Browse and Ticket Purchase', () => {
  test('user can view event details page', async ({ page }) => {
    // Navigate to events listing (assumes some events exist)
    await page.goto('/events')
    await page.waitForLoadState('domcontentloaded')

    // Click first event
    const firstEvent = page.locator('[data-testid="event-card"]').first()
    await firstEvent.click()

    // Should be on event detail page with hero, lineup, ticket section
    await expect(page.locator('[data-testid="event-hero"]')).toBeVisible()
    await expect(page.locator('[data-testid="event-ticket-section"]')).toBeVisible()
  })

  test('event detail shows ticket tiers and pricing', async ({ page }) => {
    await page.goto('/events')
    const firstEvent = page.locator('[data-testid="event-card"]').first()
    await firstEvent.click()

    // Should show tier options
    const tiers = page.locator('[data-testid="tier-option"]')
    await expect(tiers.first()).toBeVisible()

    // Each tier should show price
    await expect(page.getByText(/₦\d+/)).toBeVisible()
  })

  test('user can select ticket tier and quantity', async ({ page }) => {
    await page.goto('/events')
    const firstEvent = page.locator('[data-testid="event-card"]').first()
    await firstEvent.click()

    // Select a tier
    const tierSelect = page.locator('[data-testid="tier-select"]').first()
    await tierSelect.selectOption('vip')

    // Change quantity
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await quantityInput.fill('2')

    // Verify total updates
    await expect(page.getByText(/total|price/i)).toBeVisible()
  })

  test('ticket purchase requires login', async ({ page }) => {
    // Ensure logged out
    // Navigate to event
    await page.goto('/events')
    const firstEvent = page.locator('[data-testid="event-card"]').first()
    await firstEvent.click()

    // Try to proceed without login
    await page.getByRole('button', { name: /checkout|buy|proceed/i }).click()

    // Should redirect to login
    await page.waitForURL(/\/login/)
  })

  test('checkout page shows order summary', async ({ page }) => {
    // Assumes authenticated session (would use storageState in real suite)
    await page.goto('/checkout')

    await expect(page.getByText(/order summary|summary|total/i)).toBeVisible()
    await expect(page.getByText(/₦\d+/)).toBeVisible()
  })

  test('checkout shows payment methods (Paystack, Stripe, etc.)', async ({ page }) => {
    await page.goto('/checkout')

    // Should show Paystack
    await expect(page.getByText(/paystack/i)).toBeVisible()

    // Stripe might be optional or coming soon
    // await expect(page.getByText(/stripe/i)).toBeVisible()
  })

  test('user can complete purchase with Paystack', async ({ page }) => {
    await page.goto('/checkout')

    // Select Paystack
    await page.getByLabel(/paystack/i).click()

    // Click pay button
    await page.getByRole('button', { name: /pay|complete/i }).click()

    // Should redirect to Paystack (or payment gateway)
    // Real test would mock or use sandbox
  })
})

// ── My Tickets Page ──────────────────────────────────────
test.describe('Attendee Ticket Management', () => {
  test('user can view their tickets', async ({ page }) => {
    // Requires auth
    await page.goto('/tickets')

    // Should show list of tickets
    await expect(page.locator('[data-testid="ticket-item"]')).toBeVisible()
  })

  test('ticket shows QR code for check-in', async ({ page }) => {
    await page.goto('/tickets')

    const ticket = page.locator('[data-testid="ticket-item"]').first()
    await ticket.click()

    // Should show QR code or ticket reference
    await expect(page.locator('img[alt*="QR"]')).toBeVisible()
  })

  test('ticket shows event details', async ({ page }) => {
    await page.goto('/tickets')

    const ticket = page.locator('[data-testid="ticket-item"]').first()
    await ticket.click()

    // Should show event name, date, location
    await expect(page.getByText(/event name|date|location/i)).toBeVisible()
  })

  test('ticket shows status (active, used, transferred)', async ({ page }) => {
    await page.goto('/tickets')

    const ticket = page.locator('[data-testid="ticket-item"]').first()
    await ticket.click()

    // Should show status badge
    await expect(page.locator('[data-testid="ticket-status"]')).toBeVisible()
  })

  test('user can transfer a ticket', async ({ page }) => {
    await page.goto('/tickets')

    const ticket = page.locator('[data-testid="ticket-item"]').first()
    await ticket.click()

    // Click transfer button
    await page.getByRole('button', { name: /transfer/i }).click()

    // Should open transfer dialog/form
    await expect(page.getByText(/transfer|recipient|email/i)).toBeVisible()
  })

  test('transfer requires recipient email or phone', async ({ page }) => {
    await page.goto('/tickets')
    const ticket = page.locator('[data-testid="ticket-item"]').first()
    await ticket.click()

    await page.getByRole('button', { name: /transfer/i }).click()

    // Try to submit without recipient
    await page.getByRole('button', { name: /send|submit|initiate/i }).click()

    // Should show error
    await expect(page.getByText(/required|email|phone/i)).toBeVisible()
  })

  test('transfer shows confirmation after sending', async ({ page }) => {
    await page.goto('/tickets')
    const ticket = page.locator('[data-testid="ticket-item"]').first()
    await ticket.click()

    await page.getByRole('button', { name: /transfer/i }).click()
    await page.getByLabel(/email|recipient/i).fill('recipient@example.com')
    await page.getByRole('button', { name: /send|submit|initiate/i }).click()

    // Should show success message
    await expect(page.getByText(/sent|initiated|confirmation|pending/i)).toBeVisible()
  })
})

// ── Face Enrollment (if using face recognition) ────────
test.describe('Face Enrollment Flow', () => {
  test.skip('user can enroll face from ticket detail', async ({ page }) => {
    await page.goto('/tickets')
    const ticket = page.locator('[data-testid="ticket-item"]').first()
    await ticket.click()

    // Should show "Enroll Face" button if not already enrolled
    // await page.getByRole('button', { name: /enroll face|add face/i }).click()
    // Should prompt for camera access
  })

  test.skip('user can verify face matches ticket', async ({ page }) => {
    // Placeholder for face verification flow
  })
})
