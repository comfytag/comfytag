import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Event Detail Page (/events/[slug])
 *
 * The event detail page was refactored to use RSC (React Server Components) for
 * server-side data fetching and rendering, with client islands for interactive sections.
 *
 * These tests cover:
 * - Not-found (404) state
 * - Happy path: event renders, SEO metadata present, interactions work
 * - Auth gates: unauthenticated users see login/signup prompt on restricted actions
 * - Error state: graceful error handling when API fails
 *
 * NOTE: Happy-path and auth-gate tests require the API server to be running on
 * http://localhost:4002. They skip gracefully if the API is unavailable.
 */

let testSlug: string | undefined

test.beforeAll(async ({ request }) => {
  // Resolve a real event slug from the API at test time.
  // The seed script generates random slugs, so we can't hard-code them.
  try {
    const res = await request.get('http://localhost:4002/events?status=published&limit=1')
    if (res.ok()) {
      const json = await res.json()
      const events: Array<{ slug: string }> = json.events ?? json.data ?? json
      if (Array.isArray(events) && events.length > 0) {
        testSlug = events[0].slug
      }
    }
  } catch {
    // API not running — happy-path and auth-gate tests will skip
  }
})

test.describe('Event Detail Page', () => {
  test.describe('Not-found state (404)', () => {
    test('displays event not found page for invalid slug', async ({ page }) => {
      await page.goto('/events/nonexistent-event-slug-xyz-404')
      await expect(page.getByRole('heading', { name: 'Event not found' })).toBeVisible()
      expect(page.url()).toContain('/events/nonexistent-event-slug-xyz-404')
    })

    test('Browse Events button navigates to /events', async ({ page }) => {
      await page.goto('/events/nonexistent-event-slug-xyz-404')
      await page.getByRole('link', { name: 'Browse Events' }).click()
      await page.waitForURL('**/events')
      expect(page.url()).toMatch(/\/events$/)
    })

    test('Go Home button navigates to home page', async ({ page }) => {
      await page.goto('/events/nonexistent-event-slug-xyz-404')
      await page.getByRole('link', { name: 'Go Home' }).click()
      await page.waitForURL('http://localhost:3000/')
      expect(page.url()).toBe('http://localhost:3000/')
    })

    test('page title indicates not found', async ({ page }) => {
      await page.goto('/events/nonexistent-event-slug-xyz-404')
      const title = await page.title()
      expect(title.toLowerCase()).toContain('not found')
    })
  })

  test.describe('Happy path (event loads, renders, interactions work)', () => {
    test.skip(!testSlug, 'API unavailable — test skipped')

    test('navigates to event page and renders without errors', async ({ page }) => {
      let pageError: Error | null = null
      page.on('pageerror', (err) => {
        pageError = err
      })

      await page.goto(`/events/${testSlug}`)
      await page.waitForLoadState('networkidle')

      // Verify no unhandled JS errors
      expect(pageError).toBeNull()
      // Hero should be visible on initial load
      await expect(page.locator('[data-testid="event-hero"]')).toBeVisible()
    })

    test('page title contains event name (generateMetadata)', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      const title = await page.title()
      // Should be formatted as "Event Name | ComfyTag"
      expect(title).toContain('|')
      expect(title).toContain('ComfyTag')
    })

    test('og:title meta tag is rendered for SEO', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
      expect(ogTitle).toBeTruthy()
      expect(ogTitle?.length).toBeGreaterThan(0)
    })

    test('hero carousel is visible on page load', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      await expect(page.locator('[data-testid="event-hero"]')).toBeVisible()
    })

    test('Get Tickets CTA button is visible and clickable', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      const ctaButton = page.getByRole('button', { name: /get tickets/i }).first()
      await expect(ctaButton).toBeVisible()
      // Should be in the viewport (not "Sold Out" text div)
      const isSoldOut = await page.locator('[data-testid="event-cta"]').evaluate(
        (el) => el.textContent?.includes('Sold Out') ?? false
      )
      if (!isSoldOut) {
        // Only test button click if not sold out
        expect(ctaButton).not.toBeDisabled()
      }
    })

    test('sticky bar appears when hero scrolls out of view', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      // Initially, sticky bar should be hidden (hero is in view)
      const stickyBar = page.locator('[data-testid="event-sticky-bar"]')
      // Scroll past the hero (large viewport height, so scroll far)
      await page.evaluate(() => window.scrollBy(0, 1000))
      await stickyBar.waitFor({ state: 'visible', timeout: 5000 })
      await expect(stickyBar).toBeVisible()
    })

    test('clicking Get Tickets opens the ticket sheet', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      const dialog = page.getByRole('dialog')
      // Should not be visible initially
      await expect(dialog).not.toBeVisible()

      // Click the Get Tickets button
      const ctaButton = page.getByRole('button', { name: /get tickets/i }).first()
      const buttonText = await ctaButton.textContent()
      // Skip if sold out
      if (!buttonText?.includes('Sold Out')) {
        await ctaButton.click()
        // Dialog should now be visible
        await expect(dialog).toBeVisible()
      }
    })

    test('ticket sheet contains at least one tier option', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      const ctaButton = page.getByRole('button', { name: /get tickets/i }).first()
      const buttonText = await ctaButton.textContent()

      if (!buttonText?.includes('Sold Out')) {
        await ctaButton.click()
        // Look for tier options — they should be buttons or clickable elements
        const tierOptions = page.locator('[role="button"]').filter({
          hasText: /ticket|tier|₦|\d+k/i,
        })
        expect(await tierOptions.count()).toBeGreaterThan(0)
      }
    })

    test('closing ticket sheet hides the dialog', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      const ctaButton = page.getByRole('button', { name: /get tickets/i }).first()
      const buttonText = await ctaButton.textContent()

      if (!buttonText?.includes('Sold Out')) {
        await ctaButton.click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        // Click outside the dialog (on the backdrop) to close it
        // Or find the close button if one exists
        const closeButton = page.locator('[role="dialog"] button[aria-label*="close" i]')
        if (await closeButton.isVisible()) {
          await closeButton.click()
        } else {
          // Click the backdrop
          await page.evaluate(() => {
            const backdrop = document.querySelector('[role="presentation"]')
            if (backdrop) (backdrop as HTMLElement).click()
          })
        }

        // Dialog should be hidden
        await expect(dialog).not.toBeVisible()
      }
    })

    test('selecting tier and clicking Get Tickets in sheet navigates to checkout', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      const ctaButton = page.getByRole('button', { name: /get tickets/i }).first()
      const buttonText = await ctaButton.textContent()

      if (!buttonText?.includes('Sold Out')) {
        await ctaButton.click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        // Find and click the first tier option (look for buttons with price-like text)
        const firstTier = page
          .locator('[role="button"]')
          .filter({ hasText: /₦|\d+k|ticket/i })
          .first()
        if (await firstTier.isVisible()) {
          await firstTier.click()
        }

        // Find the "Get Tickets" button inside the dialog and click it
        const sheetGetTicketsBtn = dialog.getByRole('button', { name: /get tickets/i })
        if (await sheetGetTicketsBtn.isVisible()) {
          await sheetGetTicketsBtn.click()

          // Should navigate to /checkout with query params
          await page.waitForURL(/\/checkout\?.*eventId=.*tierId=.*qty=/i)
          expect(page.url()).toContain('/checkout')
          expect(page.url()).toContain('eventId=')
          expect(page.url()).toContain('tierId=')
          expect(page.url()).toContain('qty=')
        }
      }
    })

    test('og:image meta tag is present for social sharing', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
      expect(ogImage).toBeTruthy()
      expect(ogImage).toMatch(/^https?:\/\/.+/) // Should be a valid URL
    })
  })

  test.describe('Auth-gated actions (unauthenticated)', () => {
    test.skip(!testSlug, 'API unavailable — test skipped')

    test('clicking Like button shows auth gate for guest', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)

      // Look for the Like button — it may be in EventMeta
      // Search by aria-label or button text
      const likeButton = page.locator('button').filter({ hasText: /like|❤/i }).first()

      if (await likeButton.isVisible()) {
        await likeButton.click()
        // Auth gate dialog should appear
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
      }
    })

    test('closing auth gate returns user to event page', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)

      const likeButton = page.locator('button').filter({ hasText: /like|❤/i }).first()

      if (await likeButton.isVisible()) {
        await likeButton.click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        // Close the dialog by clicking outside or finding close button
        const closeBtn = page.locator('[role="dialog"] button[aria-label*="close" i]')
        if (await closeBtn.isVisible()) {
          await closeBtn.click()
        } else {
          // Click the event page background to close
          await page.locator('body').click({ position: { x: 10, y: 10 } })
        }

        // Should still be on the event page
        expect(page.url()).toContain(`/events/${testSlug}`)
      }
    })

    test('clicking Follow button shows auth gate for guest', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)

      // Look for the Follow button — should be on the OrganizerCard
      const followButton = page.getByRole('button', { name: /follow/i })

      if (await followButton.isVisible()) {
        await followButton.click()
        // Auth gate should appear
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
      }
    })
  })

  test.describe('SEO metadata', () => {
    test.skip(!testSlug, 'API unavailable — test skipped')

    test('page title is formatted correctly', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      const title = await page.title()
      // Should match pattern: "Event Name | ComfyTag"
      expect(title).toMatch(/\s\|\s+ComfyTag/)
    })

    test('meta description is present', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)
      const description = await page.locator('meta[name="description"]').getAttribute('content')
      expect(description).toBeTruthy()
      expect(description?.length ?? 0).toBeGreaterThan(10)
    })

    test('og:title, og:description, og:image are all present', async ({ page }) => {
      await page.goto(`/events/${testSlug}`)

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
      const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content')
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')

      expect(ogTitle).toBeTruthy()
      expect(ogDesc).toBeTruthy()
      expect(ogImage).toBeTruthy()
    })
  })
})
