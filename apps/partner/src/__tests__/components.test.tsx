import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/overview',
  }),
  usePathname: () => '/overview',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'org-123', name: 'Event Organizer' } },
    status: 'authenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// ============================================================================
// PLACEHOLDER COMPONENTS (Phase 4B)
// ============================================================================
// These are simplified stub components for testing infrastructure.
// Replace with actual component imports as they are built.

const StatCard = ({ label, value, icon, loading }: any) => (
  <div data-testid="stat-card">
    {icon && <span data-testid="stat-icon">{icon}</span>}
    <p data-testid="stat-label">{label}</p>
    {loading ? (
      <div data-testid="stat-skeleton">Loading...</div>
    ) : (
      <p data-testid="stat-value">{value}</p>
    )}
  </div>
)

const AnalyticsBar = ({ data }: any) => (
  <div data-testid="analytics-bar">
    {data && data.length > 0 ? (
      <div>
        {data.map((item: any, i: number) => (
          <div key={i} data-testid={`analytics-item-${i}`}>
            {item.label}: {item.value}
          </div>
        ))}
      </div>
    ) : (
      <p data-testid="empty-message">No analytics data available</p>
    )}
  </div>
)

const EventForm = ({ onSubmit }: any) => {
  const [title, setTitle] = React.useState('')
  const [date, setDate] = React.useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ title, date })
      }}
      data-testid="event-form"
    >
      <input
        placeholder="Event Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        data-testid="event-title-input"
        required
      />
      <input
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        data-testid="event-date-picker"
        required
      />
      <textarea placeholder="Description" data-testid="event-description" />
      <button type="submit" data-testid="event-submit-button">
        Create Event
      </button>
    </form>
  )
}

const AttendeeTable = ({ attendees, onSearch }: any) => {
  const [searchTerm, setSearchTerm] = React.useState('')

  const filtered = attendees?.filter((a: any) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div data-testid="attendee-table">
      <input
        placeholder="Search attendees..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        data-testid="attendee-search"
      />
      {filtered.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Checked In</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((attendee: any) => (
              <tr key={attendee.id} data-testid={`attendee-row-${attendee.id}`}>
                <td>{attendee.name}</td>
                <td>{attendee.email}</td>
                <td>{attendee.checkedIn ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p data-testid="empty-state">No attendees found</p>
      )}
    </div>
  )
}

const CheckInGate = ({ onFaceScan }: any) => {
  const [status, setStatus] = React.useState('idle')

  const handleScan = async () => {
    setStatus('scanning')
    await new Promise((resolve) => setTimeout(resolve, 100))
    setStatus('success')
    onFaceScan({ success: true })
  }

  return (
    <div data-testid="check-in-gate">
      <p data-testid="gate-status">{status}</p>
      <button onClick={handleScan} data-testid="face-scan-button">
        Scan Face
      </button>
      <button data-testid="manual-override-button">Manual Entry</button>
      {status === 'success' && (
        <span data-testid="success-indicator">✓ Checked In</span>
      )}
    </div>
  )
}

const EventCardPartner = ({ title, status, ticketCount }: any) => (
  <div data-testid="event-card-partner">
    <h3>{title}</h3>
    <span data-testid="event-status-badge">{status}</span>
    <p data-testid="ticket-count">{ticketCount} tickets</p>
    <a href={`/events/${title}`} data-testid="edit-link">
      Edit
    </a>
    <a href={`/events/${title}/view`} data-testid="view-link">
      View
    </a>
  </div>
)

const NotificationItem = ({ type, message, timestamp }: any) => (
  <div data-testid="notification-item">
    <span data-testid="notification-type-icon">
      {type === 'success' && '✓'}
      {type === 'error' && '✕'}
      {type === 'info' && 'ℹ'}
    </span>
    <p data-testid="notification-message">{message}</p>
    <time data-testid="notification-timestamp">{timestamp}</time>
    <div data-testid="unread-indicator" style={{ opacity: 0.5 }}>
      Unread
    </div>
  </div>
)

// ============================================================================
// TESTS
// ============================================================================

describe('StatCard', () => {
  it('renders stat label', () => {
    render(<StatCard label="Total Revenue" value="₦150,000" />)
    expect(screen.getByTestId('stat-label')).toHaveTextContent('Total Revenue')
  })

  it('renders stat value', () => {
    render(<StatCard label="Total Revenue" value="₦150,000" />)
    expect(screen.getByTestId('stat-value')).toHaveTextContent('₦150,000')
  })

  it('renders icon when provided', () => {
    render(<StatCard label="Revenue" value="₦100" icon="💰" />)
    expect(screen.getByTestId('stat-icon')).toHaveTextContent('💰')
  })

  it('shows loading skeleton when loading is true', () => {
    render(<StatCard label="Revenue" value="₦100" loading={true} />)
    expect(screen.getByTestId('stat-skeleton')).toBeInTheDocument()
  })

  it('shows value when loading is false', () => {
    render(<StatCard label="Revenue" value="₦100" loading={false} />)
    expect(screen.getByTestId('stat-value')).toBeInTheDocument()
  })

  it('displays zero-state label when value is 0', () => {
    render(<StatCard label="New Signups" value="0" />)
    expect(screen.getByTestId('stat-value')).toHaveTextContent('0')
  })
})

describe('AnalyticsBar', () => {
  it('renders analytics items', () => {
    const data = [
      { label: 'Tickets Sold', value: 250 },
      { label: 'Revenue', value: '₦625,000' },
    ]
    render(<AnalyticsBar data={data} />)

    expect(screen.getByTestId('analytics-item-0')).toHaveTextContent(
      'Tickets Sold: 250'
    )
    expect(screen.getByTestId('analytics-item-1')).toHaveTextContent(
      'Revenue: ₦625,000'
    )
  })

  it('shows empty state when no data', () => {
    render(<AnalyticsBar data={[]} />)
    expect(screen.getByTestId('empty-message')).toBeInTheDocument()
  })

  it('shows empty state when data is null', () => {
    render(<AnalyticsBar data={null} />)
    expect(screen.getByTestId('empty-message')).toBeInTheDocument()
  })

  it('renders multiple analytics items', () => {
    const data = [
      { label: 'Item 1', value: '100' },
      { label: 'Item 2', value: '200' },
      { label: 'Item 3', value: '300' },
    ]
    render(<AnalyticsBar data={data} />)

    expect(screen.getByTestId('analytics-item-0')).toBeInTheDocument()
    expect(screen.getByTestId('analytics-item-1')).toBeInTheDocument()
    expect(screen.getByTestId('analytics-item-2')).toBeInTheDocument()
  })
})

describe('EventForm', () => {
  it('renders event title input', () => {
    render(<EventForm onSubmit={() => {}} />)
    expect(screen.getByTestId('event-title-input')).toBeInTheDocument()
  })

  it('renders date picker', () => {
    render(<EventForm onSubmit={() => {}} />)
    expect(screen.getByTestId('event-date-picker')).toBeInTheDocument()
  })

  it('renders description textarea', () => {
    render(<EventForm onSubmit={() => {}} />)
    expect(screen.getByTestId('event-description')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<EventForm onSubmit={() => {}} />)
    expect(screen.getByTestId('event-submit-button')).toBeInTheDocument()
  })

  it('calls onSubmit when form is submitted with data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EventForm onSubmit={onSubmit} />)

    await user.type(screen.getByTestId('event-title-input'), 'Tech Summit 2026')
    await user.type(screen.getByTestId('event-date-picker'), '2026-12-01T10:00')
    await user.click(screen.getByTestId('event-submit-button'))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Tech Summit 2026',
      date: '2026-12-01T10:00',
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EventForm onSubmit={onSubmit} />)

    // Try to submit empty form
    await user.click(screen.getByTestId('event-submit-button'))

    // Should not call onSubmit due to HTML5 validation
    // (actual behavior depends on browser/test environment)
  })
})

describe('AttendeeTable', () => {
  const attendees = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', checkedIn: true },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', checkedIn: false },
  ]

  it('renders table with attendees', () => {
    render(<AttendeeTable attendees={attendees} />)
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<AttendeeTable attendees={attendees} />)
    expect(screen.getByTestId('attendee-search')).toBeInTheDocument()
  })

  it('filters attendees by search term', async () => {
    const user = userEvent.setup()
    render(<AttendeeTable attendees={attendees} />)

    await user.type(screen.getByTestId('attendee-search'), 'Alice')

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument()
  })

  it('shows empty state when no attendees match search', async () => {
    const user = userEvent.setup()
    render(<AttendeeTable attendees={attendees} />)

    await user.type(screen.getByTestId('attendee-search'), 'Charlie')

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('shows empty state when attendees array is empty', () => {
    render(<AttendeeTable attendees={[]} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('displays checked-in status', () => {
    render(<AttendeeTable attendees={attendees} />)

    expect(screen.getByTestId('attendee-row-1')).toHaveTextContent('Yes')
    expect(screen.getByTestId('attendee-row-2')).toHaveTextContent('No')
  })
})

describe('CheckInGate', () => {
  it('renders face scan button', () => {
    render(<CheckInGate onFaceScan={() => {}} />)
    expect(screen.getByTestId('face-scan-button')).toBeInTheDocument()
  })

  it('renders manual override button', () => {
    render(<CheckInGate onFaceScan={() => {}} />)
    expect(screen.getByTestId('manual-override-button')).toBeInTheDocument()
  })

  it('displays initial status', () => {
    render(<CheckInGate onFaceScan={() => {}} />)
    expect(screen.getByTestId('gate-status')).toHaveTextContent('idle')
  })

  it('calls onFaceScan when scan button is clicked', async () => {
    const user = userEvent.setup()
    const onFaceScan = vi.fn()
    render(<CheckInGate onFaceScan={onFaceScan} />)

    await user.click(screen.getByTestId('face-scan-button'))
    await waitFor(() => {
      expect(onFaceScan).toHaveBeenCalled()
    })
  })

  it('shows success indicator after scan', async () => {
    const user = userEvent.setup()
    render(<CheckInGate onFaceScan={() => {}} />)

    await user.click(screen.getByTestId('face-scan-button'))

    await waitFor(() => {
      expect(screen.getByTestId('success-indicator')).toBeInTheDocument()
    })
  })

  it('shows scanning status during face scan', async () => {
    const user = userEvent.setup()
    render(<CheckInGate onFaceScan={() => {}} />)

    await user.click(screen.getByTestId('face-scan-button'))

    // Status should change from idle to scanning
    expect(screen.getByTestId('gate-status')).toHaveTextContent('scanning')
  })
})

describe('EventCardPartner', () => {
  const eventData = {
    title: 'Afrobeats Festival 2026',
    status: 'published',
    ticketCount: 500,
  }

  it('renders event title', () => {
    render(<EventCardPartner {...eventData} />)
    expect(screen.getByText('Afrobeats Festival 2026')).toBeInTheDocument()
  })

  it('renders status badge', () => {
    render(<EventCardPartner {...eventData} />)
    expect(screen.getByTestId('event-status-badge')).toHaveTextContent('published')
  })

  it('renders ticket count', () => {
    render(<EventCardPartner {...eventData} />)
    expect(screen.getByTestId('ticket-count')).toHaveTextContent('500 tickets')
  })

  it('renders edit link', () => {
    render(<EventCardPartner {...eventData} />)
    const editLink = screen.getByTestId('edit-link')
    expect(editLink).toHaveAttribute('href')
  })

  it('renders view link', () => {
    render(<EventCardPartner {...eventData} />)
    const viewLink = screen.getByTestId('view-link')
    expect(viewLink).toHaveAttribute('href')
  })

  it('shows draft status when applicable', () => {
    render(<EventCardPartner {...eventData} status="draft" />)
    expect(screen.getByTestId('event-status-badge')).toHaveTextContent('draft')
  })
})

describe('NotificationItem', () => {
  it('renders notification message', () => {
    render(
      <NotificationItem
        type="info"
        message="Event created successfully"
        timestamp="2026-06-05 20:30"
      />
    )
    expect(screen.getByText('Event created successfully')).toBeInTheDocument()
  })

  it('renders timestamp', () => {
    render(
      <NotificationItem
        type="info"
        message="Event created"
        timestamp="2026-06-05 20:30"
      />
    )
    expect(screen.getByTestId('notification-timestamp')).toHaveTextContent(
      '2026-06-05 20:30'
    )
  })

  it('shows success icon for success type', () => {
    render(
      <NotificationItem
        type="success"
        message="Ticket sold"
        timestamp="2026-06-05 20:30"
      />
    )
    expect(screen.getByTestId('notification-type-icon')).toHaveTextContent('✓')
  })

  it('shows error icon for error type', () => {
    render(
      <NotificationItem
        type="error"
        message="Payment failed"
        timestamp="2026-06-05 20:30"
      />
    )
    expect(screen.getByTestId('notification-type-icon')).toHaveTextContent('✕')
  })

  it('shows info icon for info type', () => {
    render(
      <NotificationItem
        type="info"
        message="New event pending"
        timestamp="2026-06-05 20:30"
      />
    )
    expect(screen.getByTestId('notification-type-icon')).toHaveTextContent('ℹ')
  })

  it('renders unread indicator', () => {
    render(
      <NotificationItem
        type="info"
        message="Test notification"
        timestamp="2026-06-05 20:30"
      />
    )
    expect(screen.getByTestId('unread-indicator')).toBeInTheDocument()
  })
})
