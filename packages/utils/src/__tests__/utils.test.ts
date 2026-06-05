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
  calculatePlatformFee,
  calculatePaystackFee,
  totalCharges,
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

  describe('calculatePlatformFee', () => {
    it('calculatePlatformFee(0) returns 0', () => {
      expect(calculatePlatformFee(0)).toBe(0)
    })

    it('calculatePlatformFee(1000) with default 5% returns 50', () => {
      expect(calculatePlatformFee(1000)).toBe(50)
    })

    it('calculatePlatformFee(0.5) rounds to 0', () => {
      expect(calculatePlatformFee(0.5)).toBe(0)
    })

    it('calculatePlatformFee(1000, 10) with 10% returns 100', () => {
      expect(calculatePlatformFee(1000, 10)).toBe(100)
    })
  })

  describe('calculatePaystackFee', () => {
    it('calculatePaystackFee(0) returns 0', () => {
      expect(calculatePaystackFee(0)).toBe(0)
    })

    it('calculatePaystackFee(10000) returns 250', () => {
      // 10000 * 0.015 + 100 = 150 + 100 = 250
      expect(calculatePaystackFee(10_000)).toBe(250)
    })

    it('calculatePaystackFee(200000) returns capped at 2000', () => {
      // 200000 * 0.015 + 100 = 3100 + 100 = 3200, capped at 2000
      expect(calculatePaystackFee(200_000)).toBe(2000)
    })
  })

  describe('totalCharges', () => {
    it('totalCharges(10000) returns { platformFee: 500, paystackFee: 250, total: 10750 }', () => {
      const result = totalCharges(10_000)
      expect(result).toEqual({
        platformFee: 500,
        paystackFee: 250,
        total: 10_750,
      })
    })

    it('totalCharges(0) returns all zeros', () => {
      const result = totalCharges(0)
      expect(result).toEqual({
        platformFee: 0,
        paystackFee: 0,
        total: 0,
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

    it('STORAGE_KEYS has 5 keys', () => {
      expect(Object.keys(STORAGE_KEYS).length).toBe(5)
    })
  })
})
