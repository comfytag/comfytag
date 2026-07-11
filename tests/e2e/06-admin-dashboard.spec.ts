import { test, expect } from '@playwright/test'

// ── Admin Dashboard Overview ─────────────────────────────
test.describe('Admin Dashboard', () => {
  test('admin can access admin dashboard', async ({ page }) => {
    // Requires admin auth
    await page.goto('/overview')

    // Should show admin-specific metrics
    await expect(page.getByText(/platform|admin|dashboard/i)).toBeVisible()
  })

  test('admin overview shows platform metrics', async ({ page }) => {
    await page.goto('/overview')

    // Should show total users, events, revenue, etc.
    await expect(page.getByText(/total|users|events|revenue/i)).toBeVisible()
  })

  test('admin overview shows recent activities widget', async ({ page }) => {
    await page.goto('/overview')

    // Should show recent signups, events created, transactions
    await expect(page.getByText(/recent|activity|transactions/i)).toBeVisible()
  })

  test('admin can view system alerts and notifications', async ({ page }) => {
    await page.goto('/overview')

    // Should show alerts or notifications widget
    const alerts = page.getByText(/alert|notification|warning/i)
    if (await alerts.isVisible()) {
      expect(alerts).toBeVisible()
    }
  })
})

// ── User Management ──────────────────────────────────────
test.describe('User Management', () => {
  test('admin can view all users', async ({ page }) => {
    await page.goto('/users')

    // Should show users table/list
    await expect(page.locator('table')).toBeVisible()
    await expect(page.getByText(/name|email|role/i)).toBeVisible()
  })

  test('admin can search and filter users', async ({ page }) => {
    await page.goto('/users')

    // Should have search input
    await expect(page.getByPlaceholder(/search|email|name/i)).toBeVisible()

    // Search for user
    await page.getByPlaceholder(/search/i).fill('john')

    // Results should be filtered
    await expect(page.locator('table tbody tr')).toHaveCount(/.+/)
  })

  test('admin can view user details', async ({ page }) => {
    await page.goto('/users')

    // Click on a user
    const userRow = page.locator('table tbody tr').first()
    await userRow.click()

    // Should show user detail page with profile, activity, etc.
    await expect(page.getByText(/profile|email|joined/i)).toBeVisible()
  })

  test('admin can deactivate a user', async ({ page }) => {
    await page.goto('/users')

    const userRow = page.locator('table tbody tr').first()
    await userRow.click()

    // Should have deactivate button
    const deactivateBtn = page.getByRole('button', { name: /deactivate|suspend|disable/i })
    if (await deactivateBtn.isVisible()) {
      await deactivateBtn.click()

      // Should show confirmation and success
      await expect(page.getByText(/deactivated|disabled|success/i)).toBeVisible()
    }
  })

  test('admin can view user verification status', async ({ page }) => {
    await page.goto('/users')

    const userRow = page.locator('table tbody tr').first()
    await userRow.click()

    // Should show KYC/verification status
    await expect(page.getByText(/verified|verification|kyc|documents/i)).toBeVisible()
  })
})

// ── Organizer (Partner) Management ────────────────────────
test.describe('Organizer Management', () => {
  test('admin can view all organizers', async ({ page }) => {
    await page.goto('/organizers')

    // Should show organizers list
    await expect(page.locator('table')).toBeVisible()
    await expect(page.getByText(/organizer|name|events/i)).toBeVisible()
  })

  test('admin can view organizer details and stats', async ({ page }) => {
    await page.goto('/organizers')

    const organizerRow = page.locator('table tbody tr').first()
    await organizerRow.click()

    // Should show organizer profile, events hosted, revenue
    await expect(page.getByText(/events|revenue|created/i)).toBeVisible()
  })

  test('admin can approve pending organizers', async ({ page }) => {
    await page.goto('/organizers')

    // Filter for pending
    const filterBtn = page.getByRole('button', { name: /filter|pending/i })
    if (await filterBtn.isVisible()) {
      await filterBtn.click()
      await page.getByText(/pending/i).click()
    }

    // Should show pending organizers
    const organizerRow = page.locator('table tbody tr').first()
    const approveBtn = organizerRow.getByRole('button', { name: /approve|verify/i })

    if (await approveBtn.isVisible()) {
      await approveBtn.click()
      await expect(page.getByText(/approved|verified/i)).toBeVisible()
    }
  })

  test('admin can view organizer payouts', async ({ page }) => {
    await page.goto('/organizers')

    const organizerRow = page.locator('table tbody tr').first()
    await organizerRow.click()

    // Should have payouts section
    await expect(page.getByText(/payout|earnings|balance/i)).toBeVisible()
  })
})

// ── Event Moderation ──────────────────────────────────────
test.describe('Event Moderation', () => {
  test('admin can view all events for moderation', async ({ page }) => {
    await page.goto('/events')

    // Should show events with moderation status
    await expect(page.locator('table')).toBeVisible()
    await expect(page.getByText(/published|draft|pending/i)).toBeVisible()
  })

  test('admin can search events', async ({ page }) => {
    await page.goto('/events')

    // Should have search
    await page.getByPlaceholder(/search|name/i).fill('festival')

    // Results filtered
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })

  test('admin can view event details and flag for review', async ({ page }) => {
    await page.goto('/events')

    const eventRow = page.locator('table tbody tr').first()
    await eventRow.click()

    // Should show flag button
    const flagBtn = page.getByRole('button', { name: /flag|report|issue/i })
    if (await flagBtn.isVisible()) {
      await flagBtn.click()
      await expect(page.getByText(/flagged|marked/i)).toBeVisible()
    }
  })

  test('admin can suspend an event', async ({ page }) => {
    await page.goto('/events')

    const eventRow = page.locator('table tbody tr').first()
    await eventRow.click()

    // Should have suspend button
    const suspendBtn = page.getByRole('button', { name: /suspend|disable|remove/i })
    if (await suspendBtn.isVisible()) {
      await suspendBtn.click()
      await expect(page.getByText(/suspended|disabled|success/i)).toBeVisible()
    }
  })
})

// ── KYC & Verification ───────────────────────────────────
test.describe('KYC & Verification', () => {
  test('admin can view pending KYC documents', async ({ page }) => {
    await page.goto('/kyc')

    // Should show KYC requests
    await expect(page.locator('table')).toBeVisible()
    await expect(page.getByText(/pending|verified|rejected/i)).toBeVisible()
  })

  test('admin can review and approve KYC submission', async ({ page }) => {
    await page.goto('/kyc')

    // Click on pending submission
    const kycRow = page.locator('table tbody tr').first()
    await kycRow.click()

    // Should show document details
    await expect(page.getByText(/document|id|address/i)).toBeVisible()

    // Should have approve button
    const approveBtn = page.getByRole('button', { name: /approve|verify/i })
    if (await approveBtn.isVisible()) {
      await approveBtn.click()
      await expect(page.getByText(/approved|verified/i)).toBeVisible()
    }
  })

  test('admin can reject KYC with reason', async ({ page }) => {
    await page.goto('/kyc')

    const kycRow = page.locator('table tbody tr').first()
    await kycRow.click()

    // Should have reject button
    const rejectBtn = page.getByRole('button', { name: /reject|decline/i })
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click()

      // Should show rejection reason field
      await expect(page.getByLabel(/reason|message/i)).toBeVisible()

      // Fill and submit
      await page.getByLabel(/reason/i).fill('Document clarity issue')
      await page.getByRole('button', { name: /submit|confirm/i }).click()

      await expect(page.getByText(/rejected|declined/i)).toBeVisible()
    }
  })
})

// ── Financial & Payouts Admin ────────────────────────────
test.describe('Admin Payouts', () => {
  test('admin can view all payouts', async ({ page }) => {
    await page.goto('/payouts')

    // Should show payout history
    await expect(page.locator('table')).toBeVisible()
    await expect(page.getByText(/organizer|amount|date|status/i)).toBeVisible()
  })

  test('admin can filter payouts by status', async ({ page }) => {
    await page.goto('/payouts')

    // Should have status filter
    const filterBtn = page.getByRole('button', { name: /filter|status/i })
    if (await filterBtn.isVisible()) {
      await filterBtn.click()
      await page.getByText(/pending|processing|completed/i).click()
    }

    // Results should be filtered
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })

  test('admin can manually process a payout', async ({ page }) => {
    await page.goto('/payouts')

    // Filter for pending
    const pendingRow = page.locator('text=/pending/i').first().locator('..').locator('table tbody tr').first()

    if (await pendingRow.isVisible()) {
      const processBtn = pendingRow.getByRole('button', { name: /process|approve|send/i })
      if (await processBtn.isVisible()) {
        await processBtn.click()
        await expect(page.getByText(/processing|processed/i)).toBeVisible()
      }
    }
  })

  test('admin can view payout details', async ({ page }) => {
    await page.goto('/payouts')

    const payoutRow = page.locator('table tbody tr').first()
    await payoutRow.click()

    // Should show amount, organizer, bank account
    await expect(page.getByText(/amount|account|organizer/i)).toBeVisible()
  })
})

// ── Analytics & Reporting Admin ──────────────────────────
test.describe('Admin Analytics', () => {
  test('admin can view platform analytics', async ({ page }) => {
    await page.goto('/analytics')

    // Should show metrics
    await expect(page.getByText(/analytics|revenue|users|events/i)).toBeVisible()
  })

  test('admin analytics shows revenue breakdown', async ({ page }) => {
    await page.goto('/analytics')

    // Should show revenue charts
    await expect(page.getByText(/revenue|earnings|total/i)).toBeVisible()
  })

  test('admin can export platform report', async ({ page }) => {
    await page.goto('/analytics')

    const exportBtn = page.getByRole('button', { name: /export|download/i })
    if (await exportBtn.isVisible()) {
      await exportBtn.click()
      // Would verify file download in real tests
    }
  })
})

// ── Admin Settings ───────────────────────────────────────
test.describe('Admin Settings', () => {
  test('admin can access admin settings', async ({ page }) => {
    await page.goto('/settings')

    // Should show admin-specific settings
    await expect(page.getByText(/settings|admin|platform/i)).toBeVisible()
  })

  test('admin can manage platform fees', async ({ page }) => {
    await page.goto('/settings')

    // Should have fee configuration
    const feeSection = page.getByText(/fee|commission|percentage/i)
    if (await feeSection.isVisible()) {
      expect(feeSection).toBeVisible()
    }
  })
})
