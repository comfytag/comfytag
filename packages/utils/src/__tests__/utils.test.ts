import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatNaira,
  formatDate,
  formatTime,
  isToday,
  isUpcoming,
  timeUntil,
  slugify,
  truncate,
  initials,
  maskIdentifier,
  calculateTicketCharge,
  isValidEmail,
  isValidNigerianPhone,
  authHeader,
  decodeJwtPayload,
  decodeUserId,
  NIGERIAN_STATES,
  EVENT_CATEGORIES,
  STORAGE_KEYS,
} from '../index'

describe('utils', () => {
  describe('formatNaira', () => {
    it('formatNaira(0) renders currency symbol', () => {
      const result = formatNaira(0)
      expect(result).toMatch(/₦|NGN/)
    })

    it('formatNaira(1500) renders currency symbol', () => {
      const result = formatNaira(1500)
      expect(result).toMatch(/₦|NGN/)
    })

    it('formatNaira(-100) includes negative sign', () => {
      const result = formatNaira(-100)
      expect(result).toMatch(/-|−/)
    })

    it('formatNaira(1000000) does not crash', () => {
      const result = formatNaira(1_000_000)
      expect(result).toMatch(/₦|NGN/)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('formatDate', () => {
    it('formatDate(null) returns empty string', () => {
      expect(formatDate(null)).toBe('')
    })

    it('formatDate(undefined) returns empty string', () => {
      expect(formatDate(undefined)).toBe('')
    })

    it("formatDate('') returns empty string", () => {
      expect(formatDate('')).toBe('')
    })

    it('formatDate(invalid) returns empty string', () => {
      expect(formatDate('not-a-date')).toBe('')
    })

    it("formatDate('2026-12-25') returns non-empty string with year", () => {
      const result = formatDate('2026-12-25')
      expect(result).toBeTruthy()
      expect(result).toContain('2026')
    })
  })

  describe('formatTime', () => {
    it('formatTime(null) returns empty string', () => {
      expect(formatTime(null)).toBe('')
    })

    it("formatTime('19:30') returns non-empty string", () => {
      const result = formatTime('19:30')
      expect(result).toBeTruthy()
    })

    it("formatTime(ISO timestamp) returns non-empty string", () => {
      const result = formatTime('2026-12-25T19:30:00Z')
      expect(result).toBeTruthy()
    })

    it("formatTime('not-a-time') returns the input as-is", () => {
      expect(formatTime('not-a-time')).toBe('not-a-time')
    })
  })

  describe('isToday', () => {
    it('isToday(today ISO string) returns true', () => {
      const today = new Date().toISOString()
      expect(isToday(today)).toBe(true)
    })

    it('isToday(past date) returns false', () => {
      expect(isToday('2000-01-01')).toBe(false)
    })
  })

  describe('isUpcoming', () => {
    it('isUpcoming(future date) returns true', () => {
      const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      expect(isUpcoming(future)).toBe(true)
    })

    it('isUpcoming(past date) returns false', () => {
      expect(isUpcoming('2000-01-01')).toBe(false)
    })
  })

  describe('timeUntil', () => {
    it('timeUntil(5+ days away) matches d h away pattern', () => {
      const future = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
      const result = timeUntil(future)
      expect(result).toMatch(/\d+d \d+h away/)
    })

    it('timeUntil(< 1 day away) returns hours or "Starting soon"', () => {
      const future = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      const result = timeUntil(future)
      expect(result).toMatch(/\d+h away|Starting soon/)
    })

    it('timeUntil(past date) returns "Starting soon"', () => {
      expect(timeUntil('2000-01-01')).toBe('Starting soon')
    })
  })

  describe('slugify', () => {
    it("slugify('Lagos Street Party! (2026)') converts to lowercase slug", () => {
      const result = slugify('Lagos Street Party! (2026)')
      expect(result).toBe('lagos-street-party-2026')
    })

    it("slugify('  multiple   spaces  ') collapses spaces to hyphens", () => {
      const result = slugify('  multiple   spaces  ')
      expect(result).toBe('multiple-spaces')
    })

    it("slugify('hello-world') preserves hyphens", () => {
      const result = slugify('hello-world')
      expect(result).toBe('hello-world')
    })
  })

  describe('truncate', () => {
    it("truncate('hello world', 5) adds ellipsis", () => {
      const result = truncate('hello world', 5)
      expect(result).toBe('hello...')
    })

    it("truncate('hi', 10) returns text as-is when under limit", () => {
      const result = truncate('hi', 10)
      expect(result).toBe('hi')
    })
  })

  describe('initials', () => {
    it("initials('Wahab Jimoh') returns 'WJ'", () => {
      expect(initials('Wahab Jimoh')).toBe('WJ')
    })

    it("initials('Adaeze') returns 'A'", () => {
      expect(initials('Adaeze')).toBe('A')
    })

    it("initials('') returns '?'", () => {
      expect(initials('')).toBe('?')
    })
  })

  describe('maskIdentifier', () => {
    it("maskIdentifier('08012345678') masks phone number", () => {
      expect(maskIdentifier('08012345678')).toBe('080***5678')
    })

    it("maskIdentifier('+2348012345678') masks international phone", () => {
      expect(maskIdentifier('+2348012345678')).toBe('+23***5678')
    })

    it("maskIdentifier('wahab@example.com') masks email", () => {
      expect(maskIdentifier('wahab@example.com')).toBe('wa***@example.com')
    })

    it("maskIdentifier('a@x.com') masks short email", () => {
      expect(maskIdentifier('a@x.com')).toBe('a***@x.com')
    })
  })

  describe('calculateTicketCharge', () => {
    it('free ticket (price 0) returns all zeros', () => {
      expect(calculateTicketCharge(0, 3)).toEqual({
        subtotal: 0,
        buyerFee: 0,
        organizerFee: 0,
        totalCharge: 0,
        organizerNet: 0,
      })
    })

    it('subtotal under ₦2,500: buyer pays 4.5% only, no flat add-on; organizer pays nothing', () => {
      // buyerFee round(1000*0.045) = round(45) = 45
      expect(calculateTicketCharge(1000, 1)).toEqual({
        subtotal: 1000,
        buyerFee: 45,
        organizerFee: 0,
        totalCharge: 1045,
        organizerNet: 1000,
      })
    })

    it('subtotal just under ₦2,500: no flat add-on, rounds the percentage portion', () => {
      // buyerFee round(2499*0.045) = round(112.455) = 112
      expect(calculateTicketCharge(2499, 1)).toEqual({
        subtotal: 2499,
        buyerFee: 112,
        organizerFee: 0,
        totalCharge: 2611,
        organizerNet: 2499,
      })
    })

    it('subtotal at exactly ₦2,500: flat ₦100 add-on applies', () => {
      // buyerFee round(2500*0.045) + 100 = round(112.5) + 100 = 113 + 100 = 213
      expect(calculateTicketCharge(2500, 1)).toEqual({
        subtotal: 2500,
        buyerFee: 213,
        organizerFee: 0,
        totalCharge: 2713,
        organizerNet: 2500,
      })
    })

    it('quantity multiplies the subtotal before the fee is computed', () => {
      // tier price 3000 * qty 4 = ₦12,000 subtotal (>= 2,500, so +₦100 applies)
      // buyerFee round(12000*0.045) + 100 = 540 + 100 = 640
      expect(calculateTicketCharge(3000, 4)).toEqual({
        subtotal: 12_000,
        buyerFee: 640,
        organizerFee: 0,
        totalCharge: 12_640,
        organizerNet: 12_000,
      })
    })

    it('no cap — the buyer fee keeps scaling on high-value tickets', () => {
      // buyerFee round(200000*0.045) + 100 = 9000 + 100 = 9100
      expect(calculateTicketCharge(200_000, 1)).toEqual({
        subtotal: 200_000,
        buyerFee: 9100,
        organizerFee: 0,
        totalCharge: 209_100,
        organizerNet: 200_000,
      })
    })

    it('organizer always nets the full subtotal regardless of price or quantity', () => {
      expect(calculateTicketCharge(15_000, 3)).toEqual({
        subtotal: 45_000,
        buyerFee: 2125, // round(45000*0.045) + 100 = 2025 + 100
        organizerFee: 0,
        totalCharge: 47_125,
        organizerNet: 45_000,
      })
    })
  })

  describe('isValidEmail', () => {
    it("isValidEmail('user@example.com') returns true", () => {
      expect(isValidEmail('user@example.com')).toBe(true)
    })

    it("isValidEmail('user+tag@domain.co.uk') returns true", () => {
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true)
    })

    it("isValidEmail('@no-user.com') returns false", () => {
      expect(isValidEmail('@no-user.com')).toBe(false)
    })

    it("isValidEmail('no-at-sign') returns false", () => {
      expect(isValidEmail('no-at-sign')).toBe(false)
    })
  })

  describe('isValidNigerianPhone', () => {
    it("isValidNigerianPhone('+2348012345678') returns true", () => {
      expect(isValidNigerianPhone('+2348012345678')).toBe(true)
    })

    it("isValidNigerianPhone('08012345678') returns true", () => {
      expect(isValidNigerianPhone('08012345678')).toBe(true)
    })

    it("isValidNigerianPhone('0701234') returns false (too short)", () => {
      expect(isValidNigerianPhone('0701234')).toBe(false)
    })

    it("isValidNigerianPhone('08112345678') returns true (81 valid)", () => {
      expect(isValidNigerianPhone('08112345678')).toBe(true)
    })

    it("isValidNigerianPhone('07012345678') returns true", () => {
      expect(isValidNigerianPhone('07012345678')).toBe(true)
    })

    it("isValidNigerianPhone('07512345678') returns false (5 invalid second digit)", () => {
      expect(isValidNigerianPhone('07512345678')).toBe(false)
    })
  })

  describe('authHeader', () => {
    it("authHeader('mytoken') returns Authorization header", () => {
      expect(authHeader('mytoken')).toEqual({
        headers: { Authorization: 'Bearer mytoken' },
      })
    })

    it('authHeader(null) returns empty object', () => {
      expect(authHeader(null)).toEqual({})
    })

    it('authHeader(undefined) returns empty object', () => {
      expect(authHeader(undefined)).toEqual({})
    })
  })

  describe('decodeJwtPayload', () => {
    it('decodeJwtPayload(valid token) returns parsed payload', () => {
      const payload = { sub: 'user123', name: 'Test User' }
      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
      const token = `header.${encoded}.signature`
      const result = decodeJwtPayload(token)
      expect(result).toEqual(payload)
    })

    it('decodeJwtPayload(invalid token) throws', () => {
      expect(() => decodeJwtPayload('invalid.token')).toThrow()
    })
  })

  describe('decodeUserId', () => {
    it('decodeUserId(valid token with _id) returns _id', () => {
      const payload = { _id: 'user-123', name: 'Test' }
      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
      const token = `header.${encoded}.signature`
      expect(decodeUserId(token)).toBe('user-123')
    })

    it('decodeUserId(valid token with id) returns id', () => {
      const payload = { id: 'user-456', name: 'Test' }
      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
      const token = `header.${encoded}.signature`
      expect(decodeUserId(token)).toBe('user-456')
    })

    it('decodeUserId(valid token with sub) returns sub', () => {
      const payload = { sub: 'user-789', name: 'Test' }
      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
      const token = `header.${encoded}.signature`
      expect(decodeUserId(token)).toBe('user-789')
    })

    it('decodeUserId(invalid token) returns empty string', () => {
      expect(decodeUserId('invalid.token')).toBe('')
    })
  })

  describe('NIGERIAN_STATES', () => {
    it("NIGERIAN_STATES includes 'Lagos'", () => {
      expect(NIGERIAN_STATES).toContain('Lagos')
    })

    it("NIGERIAN_STATES includes 'FCT - Abuja'", () => {
      expect(NIGERIAN_STATES).toContain('FCT - Abuja')
    })

    it('NIGERIAN_STATES has 37 states', () => {
      expect(NIGERIAN_STATES.length).toBe(37)
    })
  })

  describe('EVENT_CATEGORIES', () => {
    it("EVENT_CATEGORIES includes 'Music'", () => {
      expect(EVENT_CATEGORIES).toContain('Music')
    })

    it('EVENT_CATEGORIES has 15 categories', () => {
      expect(EVENT_CATEGORIES.length).toBe(15)
    })
  })

  describe('STORAGE_KEYS', () => {
    it('STORAGE_KEYS.AUTH_TOKEN exists', () => {
      expect(STORAGE_KEYS.AUTH_TOKEN).toBe('comfytag_auth_token')
    })

    it('STORAGE_KEYS.EVENT_DRAFT exists', () => {
      expect(STORAGE_KEYS.EVENT_DRAFT).toBe('comfytag_event_draft')
    })

    it('STORAGE_KEYS has 6 keys', () => {
      expect(Object.keys(STORAGE_KEYS).length).toBe(6)
    })
  })
})
