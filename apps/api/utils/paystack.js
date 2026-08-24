// Single point of contact with Paystack's REST API for the whole backend.
// Nothing outside this file should call api.paystack.co directly.

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

// Generous enough to avoid false negatives on a real but slow Paystack response
// (this often gates a live payment verification, where wrongly declaring a
// genuine charge "failed" is worse than waiting a bit longer) while still
// putting a hard ceiling on requests that would otherwise hang indefinitely.
const PAYSTACK_TIMEOUT_MS = 15000

export class PaystackApiError extends Error {
  constructor(message, status, paystackCode) {
    super(message)
    this.name = 'PaystackApiError'
    this.status = status
    this.paystackCode = paystackCode
  }
}

const paystackRequest = async (method, path, { body, query } = {}) => {
  const url = new URL(`${PAYSTACK_BASE_URL}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, value)
    }
  }

  let response
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
    })
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new PaystackApiError(`Paystack request timed out after ${PAYSTACK_TIMEOUT_MS}ms`, 504)
    }
    throw new PaystackApiError(`Could not reach Paystack: ${err.message}`, 502)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new PaystackApiError('Invalid JSON response from Paystack', response.status)
  }

  if (!response.ok || data.status === false) {
    throw new PaystackApiError(
      data?.message || `Paystack request failed with status ${response.status}`,
      response.status,
      data?.code
    )
  }

  return data
}

// GET /transaction/verify/:reference
export const verifyTransaction = (reference) =>
  paystackRequest('GET', `/transaction/verify/${encodeURIComponent(reference)}`)

// Confirms a reference is a genuine, successful charge for the expected amount.
// The single source of truth for "is this reference real" — used by both the
// standalone verify endpoint and ticket creation, so there is one check, not two.
// Never throws — callers get a uniform { ok, reason, data } shape whether the
// reference is bad, the charge failed, the amount is wrong, or Paystack itself errored.
export const verifyAndCheckPaystackReference = async (reference, expectedAmountKobo) => {
  let data
  try {
    ;({ data } = await verifyTransaction(reference))
  } catch (err) {
    return { ok: false, reason: err.message || 'Could not verify payment with Paystack', data: null }
  }

  if (!data || !data.status || data.amount === undefined) {
    return { ok: false, reason: 'Incomplete payment data from Paystack', data }
  }

  if (data.status !== 'success') {
    return { ok: false, reason: 'Payment was not successful', data }
  }

  if (typeof expectedAmountKobo === 'number' && data.amount !== expectedAmountKobo) {
    return { ok: false, reason: 'Charged amount does not match the expected ticket price', data }
  }

  return { ok: true, data }
}

// GET /bank — list of Nigerian banks with their Paystack bank codes
export const listBanks = () =>
  paystackRequest('GET', '/bank', { query: { country: 'nigeria', currency: 'NGN' } })

// GET /bank/resolve — confirms an account number belongs to a real account and returns its name
export const resolveAccountNumber = (accountNumber, bankCode) =>
  paystackRequest('GET', '/bank/resolve', {
    query: { account_number: accountNumber, bank_code: bankCode },
  })

// POST /transferrecipient — creates a payout target Paystack can send money to
export const createTransferRecipient = ({ name, account_number, bank_code }) =>
  paystackRequest('POST', '/transferrecipient', {
    body: { type: 'nuban', name, account_number, bank_code, currency: 'NGN' },
  })

// POST /transfer — moves money from the platform's Paystack balance to a recipient
export const initiateTransfer = ({ amount, recipient, reason, reference }) =>
  paystackRequest('POST', '/transfer', {
    body: { source: 'balance', amount, recipient, reason, reference },
  })
