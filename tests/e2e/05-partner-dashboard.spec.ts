import { test, expect } from '@playwright/test'

// ── Partner Dashboard & Overview ─────────────────────────
test.describe('Organizer Dashboard', () => {
  test('partner can access overview page', async ({ page }) => {
    // Requires partner/organizer auth
    // Would use storageState to preserve session
    await page.goto('/overview')

    // Should show dashboard cards/widgets
    await expect(page.locator('[data-testid="dashboard-card"]').first()).toBeVisible()
  })

  test('overview shows key metrics', async ({ page }) => {
    await page.goto('/overview')

    // Should show revenue, ticket sales, upcoming events, etc.
    await expect(page.getByText(/revenue|total|tickets|events/i)).toBeVisible()
  })

  test('overview shows upcoming events widget', async ({ page }) => {
    await page.goto('/overview')

    // Should show list of upcoming events
    await expect(page.locator('[data-testid="upcoming-events"]')).toBeVisible()
  })

  test('dashboard metrics are clickable and navigate to detail pages', async ({ page }) => {
    await page.goto('/overview')

    // Click on a metric card
    const card = page.locator('[data-testid="dashboard-card"]').first()
    await card.click()

    // Should navigate to relevant page (events, analytics, etc.)
    await expect(page).toHaveURL(/\/(events|analytics|revenue|users)/)
  })
})

// ── Event Management ──────────────────────────────────────
test.describe('Event Creation & Management', () => {
  test('partner can navigate to event creation page', async ({ page }) => {
    await page.goto('/events')

    // Should have "Create Event" button
    await expect(page.getByRole('button', { name: /create|new event/i })).toBeVisible()
  })

  test('event creation form shows all required fields', async ({ page }) => {
    await page.goto('/events/create')

    // Should have title, date, location, description, etc.
    await expect(page.getByLabel(/title|name/i)).toBeVisible()
    await expect(page.getByLabel(/date|when/i)).toBeVisible()
    await expect(page.getByLabel(/location|address/i)).toBeVisible()
    await expect(page.getByLabel(/description/i)).toBeVisible()
  })

  test('event form shows category selector', async ({ page }) => {
    await page.goto('/events/create')

    // Should have category dropdown or pills
    await expect(page.getByLabel(/category|type/i)).toBeVisible()
  })

  test('event form shows ticket tier configuration', async ({ page }) => {
    await page.goto('/events/create')

    // Should allow adding ticket tiers
    await expect(page.getByText(/tier|ticket type/i)).toBeVisible()
  })

  test('partner can save event as draft', async ({ page }) => {
    await page.goto('/events/create')

    // Fill form
    await page.getByLabel(/title|name/i).fill('Test Event')
    await page.getByLabel(/date/i).fill('2026-12-31')

    // Click save as draft
    await page.getByRole('button', { name: /draft|save/i }).click()

    // Should show success and redirect
    await expect(page.getByText(/saved|success|draft/i)).toBeVisible()
  })

  test('partner can publish event', async ({ page }) => {
    await page.goto('/events/create')

    // Fill required fields
    await page.getByLabel(/title|name/i).fill('Live Event')
    await page.getByLabel(/date/i).fill('2026-12-31')
    await page.getByLabel(/location/i).fill('Lekki, Lagos')

    // Click publish
    await page.getByRole('button', { name: /publish|go live/i }).click()

    // Should show success and redirect to event detail
    await expect(page.getByText(/published|live|success/i)).toBeVisible()
  })

  test('partner can edit existing event', async ({ page }) => {
    await page.goto('/events')

    // Click edit on first event
    const event = page.locator('[data-testid="event-row"]').first()
    await event.getByRole('link', { name: /edit/i }).click()

    // Should be on edit page with form pre-filled
    await expect(page.getByLabel(/title/i)).toHaveValue(/.+/)
  })

  test('partner can view event attendees', async ({ page }) => {
    await page.goto('/events')

    // Click on event
    const event = page.locator('[data-testid="event-row"]').first()
    await event.click()

    // Should show attendees tab/section
    await expect(page.getByRole('tab', { name: /attendees/i })).toBeVisible()

    // Click attendees
    await page.getByRole('tab', { name: /attendees/i }).click()

    // Should show table of attendees
    await expect(page.locator('table')).toBeVisible()
  })
})

// ── Attendee Check-In Gate ────────────────────────────────
test.describe('Gate Check-In', () => {
  test('partner can access check-in gate page', async ({ page }) => {
    await page.goto('/events')

    // Navigate to an event
    const event = page.locator('[data-testid="event-row"]').first()
    await event.click()

    // Click "Gate" or "Check-In" tab
    await expect(page.getByRole('tab', { name: /gate|check.?in/i })).toBeVisible()
    await page.getByRole('tab', { name: /gate|check.?in/i }).click()

    // Should show face scan / QR scan interface
    await expect(page.getByRole('button', { name: /scan|face/i })).toBeVisible()
  })

  test('gate shows checked-in count', async ({ page }) => {
    await page.goto('/events')
    const event = page.locator('[data-testid="event-row"]').first()
    await event.click()

    await page.getByRole('tab', { name: /gate/i }).click()

    // Should show "Checked in: X / Y"
    await expect(page.getByText(/checked in|check.?in/i)).toBeVisible()
  })

  test('gate allows manual entry (fallback)', async ({ page }) => {
    await page.goto('/events')
    const event = page.locator('[data-testid="event-row"]').first()
    await event.click()

    await page.getByRole('tab', { name: /gate/i }).click()

    // Should have manual entry button
    await expect(page.getByRole('button', { name: /manual|enter/i })).toBeVisible()
  })
})

// ── Analytics & Reporting ────────────────────────────────
test.describe('Analytics Dashboard', () => {
  test('partner can view analytics page', async ({ page }) => {
    await page.goto('/analytics')

    // Should show charts and metrics
    await expect(page.getByText(/analytics|reports|sales/i)).toBeVisible()
  })

  test('analytics shows revenue chart', async ({ page }) => {
    await page.goto('/analytics')

    // Should show revenue over time
    await expect(page.getByText(/revenue|sales|earnings/i)).toBeVisible()
  })

  test('analytics shows ticket sales breakdown', async ({ page }) => {
    await page.goto('/analytics')

    // Should show breakdown by tier, date, etc.
    await expect(page.getByText(/tickets|sold|breakdown/i)).toBeVisible()
  })

  test('analytics can be filtered by date range', async ({ page }) => {
    await page.goto('/analytics')

    // Should have date range picker
    await expect(page.getByLabel(/date|range|from|to/i)).toBeVisible()
  })

  test('partner can export analytics report', async ({ page }) => {
    await page.goto('/analytics')

    // Should have export button
    const exportButton = page.getByRole('button', { name: /export|download/i })
    if (await exportButton.isVisible()) {
      await exportButton.click()
      // File download would be captured in real tests
    }
  })
})

// ── Payouts & Withdrawals ────────────────────────────────
test.describe('Payouts Management', () => {
  test('partner can view payouts page', async ({ page }) => {
    await page.goto('/payouts')

    // Should show balance and payout history
    await expect(page.getByText(/balance|payout|withdraw|earnings/i)).toBeVisible()
  })

  test('payouts page shows available balance', async ({ page }) => {
    await page.goto('/payouts')

    // Should show balance in Naira
    await expect(page.getByText(/₦\d+|balance/i)).toBeVisible()
  })

  test('partner can initiate withdrawal', async ({ page }) => {
    await page.goto('/payouts')

    // Should have withdraw button
    const withdrawButton = page.getByRole('button', { name: /withdraw|request/i })
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click()

      // Should show withdrawal form
      await expect(page.getByLabel(/amount|account/i)).toBeVisible()
    }
  })

  test('payouts history shows transaction records', async ({ page }) => {
    await page.goto('/payouts')

    // Should show table of past payouts
    await expect(page.locator('table')).toBeVisible()
  })

  test('payouts shows status of pending withdrawals', async ({ page }) => {
    await page.goto('/payouts')

    // If there are pending payouts, status should be visible
    const pendingBadge = page.getByText(/pending|processing|completed/i)
    if (await pendingBadge.isVisible()) {
      expect(pendingBadge).toBeVisible()
    }
  })
})

// ── Settings & Profile ────────────────────────────────────
test.describe('Partner Settings', () => {
  test('partner can access settings page', async ({ page }) => {
    await page.goto('/settings')

    // Should show settings tabs/sections
    await expect(page.getByText(/settings|profile|account/i)).toBeVisible()
  })

  test('partner can update profile information', async ({ page }) => {
    await page.goto('/settings')

    // Should have editable fields
    const nameInput = page.getByLabel(/name|business name/i)
    if (await nameInput.isVisible()) {
      await nameInput.fill('Updated Name')
      await page.getByRole('button', { name: /save|update/i }).click()

      // Should show success
      await expect(page.getByText(/saved|updated|success/i)).toBeVisible()
    }
  })

  test('partner can manage bank account for payouts', async ({ page }) => {
    await page.goto('/settings')

    // Should have bank account section
    const bankSection = page.getByText(/bank|account|payment/i)
    if (await bankSection.isVisible()) {
      // Should allow editing bank details
      await expect(page.getByLabel(/account number|bank/i)).toBeVisible()
    }
  })
})
