import {
  eventKeys,
  profileKeys,
  ticketKeys,
  searchKeys,
  notificationKeys,
  payoutKeys,
  attendeeKeys,
  kycKeys,
  partnerKeys,
  partnerEventKeys,
} from '../hooks/queryKeys'

describe('eventKeys', () => {
  it('all is the base key', () => {
    expect(eventKeys.all).toEqual(['events'])
  })
  it('lists extends all', () => {
    expect(eventKeys.lists()).toEqual(['events', 'list'])
  })
  it('list includes filter object', () => {
    const filters = { category: 'music', page: 2 }
    expect(eventKeys.list(filters)).toEqual(['events', 'list', filters])
  })
  it('detail includes slug', () => {
    expect(eventKeys.detail('my-event')).toEqual(['events', 'detail', 'my-event'])
  })
  it('comments includes eventId', () => {
    expect(eventKeys.comments('abc123')).toEqual(['events', 'comments', 'abc123'])
  })
  it('two different slugs produce different keys', () => {
    expect(eventKeys.detail('slug-a')).not.toEqual(eventKeys.detail('slug-b'))
  })
})

describe('ticketKeys', () => {
  it('mine is a static key', () => {
    expect(ticketKeys.mine).toEqual(['tickets', 'mine'])
  })
  it('detail includes id', () => {
    expect(ticketKeys.detail('t1')).toEqual(['tickets', 'detail', 't1'])
  })
})

describe('searchKeys', () => {
  it('trending is static', () => {
    expect(searchKeys.trending).toEqual(['search', 'trending'])
  })
  it('results includes query string', () => {
    expect(searchKeys.results('afrobeats')).toEqual([
      'search',
      'results',
      'afrobeats',
      undefined,
    ])
  })
  it('results with filters differs from results without', () => {
    const withFilters = searchKeys.results('afrobeats', { state: 'Lagos' })
    const withoutFilters = searchKeys.results('afrobeats')
    expect(withFilters).not.toEqual(withoutFilters)
  })
})

describe('notificationKeys', () => {
  it('list is static', () => {
    expect(notificationKeys.list).toEqual(['notifications'])
  })
})

describe('profileKeys', () => {
  it('me is static', () => {
    expect(profileKeys.me).toEqual(['profile', 'me'])
  })
  it('user includes id', () => {
    expect(profileKeys.user('u1')).toEqual(['profile', 'user', 'u1'])
  })
  it('organizer includes slug', () => {
    expect(profileKeys.organizer('my-org')).toEqual(['profile', 'organizer', 'my-org'])
  })
})

describe('payoutKeys', () => {
  it('wallet is static', () => {
    expect(payoutKeys.wallet).toEqual(['payouts', 'wallet'])
  })
  it('bank is static', () => {
    expect(payoutKeys.bank).toEqual(['payouts', 'bank'])
  })
})

describe('attendeeKeys', () => {
  it('list includes eventId', () => {
    expect(attendeeKeys.list('evt1')).toEqual(['attendees', 'evt1'])
  })
})

describe('kycKeys', () => {
  it('status is static', () => {
    expect(kycKeys.status).toEqual(['kyc', 'status'])
  })
})

describe('partnerEventKeys', () => {
  it('list extends all', () => {
    expect(partnerEventKeys.list()).toEqual(['partner-events', 'list'])
  })
  it('detail includes event id', () => {
    expect(partnerEventKeys.detail('e1')).toEqual(['partner-events', 'detail', 'e1'])
  })
  it('audience includes event id', () => {
    expect(partnerEventKeys.audience('e1')).toEqual(['partner-events', 'audience', 'e1'])
  })
})
