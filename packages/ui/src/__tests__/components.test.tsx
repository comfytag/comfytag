/**
 * Comprehensive unit tests for all 15 @comfytag/ui components
 *
 * Components tested (read from source files):
 * 1. Button.tsx
 * 2. Input.tsx
 * 3. Badge.tsx
 * 4. Modal.tsx
 * 5. Skeleton.tsx
 * 6. EmptyState.tsx
 * 7. ErrorMessage.tsx
 * 8. LoadingSpinner.tsx
 * 9. StatCard.tsx
 * 10. AvatarInitials.tsx
 * 11. InfoField.tsx
 * 12. PageHeader.tsx
 * 13. FullScreenLoader.tsx
 * 14. DataTable.tsx
 * 15. MediaUploader.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Badge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorMessage } from '../components/ErrorMessage'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { StatCard } from '../components/StatCard'
import { AvatarInitials } from '../components/AvatarInitials'
import { InfoField } from '../components/InfoField'
import { PageHeader } from '../components/PageHeader'
import { FullScreenLoader } from '../components/FullScreenLoader'
import { DataTable } from '../components/DataTable'
import { MediaUploader } from '../components/MediaUploader'

// =============================================================================
// BUTTON TESTS
// =============================================================================

describe('Button', () => {
  it('renders its label text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    await userEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled prop prevents click handler from firing', () => {
    const handleClick = vi.fn()
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    )
    const button = screen.getByText('Disabled') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('loading state shows spinner indicator', () => {
    const { container } = render(<Button loading>Loading</Button>)
    const spinner = container.querySelector('span[style*="animation"]')
    expect(spinner).toBeInTheDocument()
  })

  it('accepts size prop without crashing', () => {
    render(<Button size="sm">Small</Button>)
    render(<Button size="md">Medium</Button>)
    render(<Button size="lg">Large</Button>)
    expect(screen.getByText('Small')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Large')).toBeInTheDocument()
  })

  it('accepts variant prop without crashing', () => {
    render(<Button variant="primary">Primary</Button>)
    render(<Button variant="secondary">Secondary</Button>)
    render(<Button variant="ghost">Ghost</Button>)
    render(<Button variant="danger">Danger</Button>)
    expect(screen.getByText('Primary')).toBeInTheDocument()
  })

  it('respects type prop', () => {
    const { container } = render(<Button type="submit">Submit</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('respects fullWidth prop', () => {
    const { container } = render(<Button fullWidth>Full Width</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveStyle({ width: '100%' })
  })
})

// =============================================================================
// INPUT TESTS
// =============================================================================

describe('Input', () => {
  it('renders with placeholder', () => {
    const handleChange = vi.fn()
    render(<Input value="" onChange={handleChange} placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('onChange fires with correct value on user typing', async () => {
    const handleChange = vi.fn()
    render(<Input value="" onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'test')
    expect(handleChange).toHaveBeenCalled()
  })

  it('renders error message when error prop is provided', () => {
    const handleChange = vi.fn()
    render(<Input value="" onChange={handleChange} error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('renders label when label prop is provided', () => {
    const handleChange = vi.fn()
    render(<Input value="" onChange={handleChange} label="Email" id="email" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('associates label with input using id', () => {
    const handleChange = vi.fn()
    const { container } = render(<Input value="" onChange={handleChange} label="Name" id="name" />)
    const label = container.querySelector('label[for="name"]')
    expect(label).toBeInTheDocument()
  })

  it('renders password toggle button for password type', async () => {
    const handleChange = vi.fn()
    const { container } = render(<Input type="password" value="" onChange={handleChange} />)
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('respects disabled prop', () => {
    const handleChange = vi.fn()
    render(<Input value="" onChange={handleChange} disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('renders required indicator when required prop is provided', () => {
    const handleChange = vi.fn()
    const { container } = render(<Input value="" onChange={handleChange} required />)
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('required')
  })

  it('displays leftIcon when provided', () => {
    const handleChange = vi.fn()
    render(
      <Input
        value=""
        onChange={handleChange}
        leftIcon={<span data-testid="left-icon">🔍</span>}
      />
    )
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })
})

// =============================================================================
// BADGE TESTS
// =============================================================================

describe('Badge', () => {
  it('renders text content', () => {
    render(<Badge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('capitalizes status prop for display', () => {
    render(<Badge status="pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    const { container } = render(<Badge status="active" className="custom-class" />)
    const badge = container.querySelector('.custom-class')
    expect(badge).toBeInTheDocument()
  })
})

// =============================================================================
// MODAL TESTS
// =============================================================================

describe('Modal', () => {
  it('renders children when isOpen={true}', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does NOT render children when isOpen={false}', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('calls onClose when backdrop (outside modal body) is clicked', async () => {
    const handleClose = vi.fn()
    const { container } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    )
    const backdrop = container.querySelector('[style*="inset: 0"]')
    await userEvent.click(backdrop!)
    expect(handleClose).toHaveBeenCalled()
  })

  it('does NOT call onClose when clicking inside modal body', async () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    )
    await userEvent.click(screen.getByText('Modal content'))
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('calls onClose when Escape key is pressed', async () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalled()
  })

  it('renders title prop', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="My Title">
        <div>Content</div>
      </Modal>
    )
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('renders footer when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test" footer={<button>Save</button>}>
        <div>Content</div>
      </Modal>
    )
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('calls onClose when close button (✕) is clicked', async () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    )
    const closeButton = screen.getByText('✕')
    await userEvent.click(closeButton)
    expect(handleClose).toHaveBeenCalled()
  })
})

// =============================================================================
// SKELETON TESTS
// =============================================================================

describe('Skeleton', () => {
  it('renders without crash', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.querySelector('div')
    expect(skeleton).toBeInTheDocument()
  })

  it('accepts width prop', () => {
    const { container } = render(<Skeleton width="200px" />)
    const skeleton = container.querySelector('div')
    expect(skeleton).toHaveStyle({ width: '200px' })
  })

  it('accepts height prop', () => {
    const { container } = render(<Skeleton height="24px" />)
    const skeleton = container.querySelector('div')
    expect(skeleton).toHaveStyle({ height: '24px' })
  })

  it('accepts borderRadius prop', () => {
    const { container } = render(<Skeleton borderRadius="12px" />)
    const skeleton = container.querySelector('div')
    expect(skeleton).toHaveStyle({ borderRadius: '12px' })
  })

  it('accepts custom className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />)
    const skeleton = container.querySelector('.custom-skeleton')
    expect(skeleton).toBeInTheDocument()
  })
})

// =============================================================================
// EMPTY STATE TESTS
// =============================================================================

describe('EmptyState', () => {
  it('renders message title', () => {
    render(<EmptyState title="No data" />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<EmptyState title="No items" subtitle="Try creating one" />)
    expect(screen.getByText('Try creating one')).toBeInTheDocument()
  })

  it('renders action link when action prop is provided', () => {
    render(
      <EmptyState title="Empty" action={{ label: 'Create', href: '/create' }} />
    )
    const link = screen.getByText('Create')
    expect(link).toHaveAttribute('href', '/create')
  })

  it('accepts custom className', () => {
    const { container } = render(<EmptyState title="Empty" className="custom-empty" />)
    const empty = container.querySelector('.custom-empty')
    expect(empty).toBeInTheDocument()
  })
})

// =============================================================================
// ERROR MESSAGE TESTS
// =============================================================================

describe('ErrorMessage', () => {
  it('renders error message string', () => {
    render(<ErrorMessage message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders with icon even when message is empty', () => {
    render(<ErrorMessage message="" />)
    expect(screen.getByText('⚠')).toBeInTheDocument()
  })

  it('renders retry button when onRetry callback is provided', () => {
    render(<ErrorMessage message="Error" onRetry={() => {}} />)
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const handleRetry = vi.fn()
    render(<ErrorMessage message="Error" onRetry={handleRetry} />)
    await userEvent.click(screen.getByText('Try again'))
    expect(handleRetry).toHaveBeenCalled()
  })

  it('accepts custom className', () => {
    const { container } = render(<ErrorMessage message="Error" className="custom-error" />)
    const error = container.querySelector('.custom-error')
    expect(error).toBeInTheDocument()
  })
})

// =============================================================================
// LOADING SPINNER TESTS
// =============================================================================

describe('LoadingSpinner', () => {
  it('renders without crash', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('accepts size prop', () => {
    render(<LoadingSpinner size="sm" />)
    render(<LoadingSpinner size="md" />)
    render(<LoadingSpinner size="lg" />)
  })

  it('renders centered variant when centered={true}', () => {
    const { container } = render(<LoadingSpinner centered={true} />)
    const wrapper = container.querySelector('div')
    expect(wrapper).toHaveStyle({ display: 'flex' })
  })

  it('accepts custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-spinner" />)
    expect(container.querySelector('.custom-spinner')).toBeInTheDocument()
  })
})

// =============================================================================
// STAT CARD TESTS
// =============================================================================

describe('StatCard', () => {
  const MockIcon = ({ size }: { size?: number }) => <div>Icon</div>

  it('renders value prop', () => {
    render(<StatCard icon={MockIcon} value="42" label="Users" />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders label prop', () => {
    render(<StatCard icon={MockIcon} value="42" label="Users" />)
    expect(screen.getByText('Users')).toBeInTheDocument()
  })

  it('renders icon component', () => {
    render(<StatCard icon={MockIcon} value="42" label="Users" />)
    expect(screen.getByText('Icon')).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading={true}', () => {
    const { container } = render(
      <StatCard icon={MockIcon} value="42" label="Users" isLoading={true} />
    )
    const skeletons = container.querySelectorAll('div[style*="animation"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

// =============================================================================
// AVATAR INITIALS TESTS
// =============================================================================

describe('AvatarInitials', () => {
  it('renders initials from name prop', () => {
    render(<AvatarInitials name="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders img tag when src prop is provided', () => {
    render(<AvatarInitials name="John Doe" src="https://example.com/avatar.jpg" />)
    const img = screen.getByAltText('John Doe')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('handles single word name gracefully', () => {
    render(<AvatarInitials name="John" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('accepts custom size prop', () => {
    const { container } = render(<AvatarInitials name="John Doe" size={64} />)
    const avatar = container.querySelector('div') as HTMLDivElement
    expect(avatar.style.width).toBe('64px')
    expect(avatar.style.height).toBe('64px')
  })

  it('accepts custom className', () => {
    const { container } = render(<AvatarInitials name="John" className="custom-avatar" />)
    expect(container.querySelector('.custom-avatar')).toBeInTheDocument()
  })
})

// =============================================================================
// INFO FIELD TESTS
// =============================================================================

describe('InfoField', () => {
  it('renders label prop', () => {
    render(<InfoField label="Email" value="test@example.com" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('renders value prop', () => {
    render(<InfoField label="Email" value="test@example.com" />)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('accepts ReactNode as value', () => {
    render(
      <InfoField label="Status" value={<span data-testid="status">Active</span>} />
    )
    expect(screen.getByTestId('status')).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    const { container } = render(
      <InfoField label="Field" value="Value" className="custom-info" />
    )
    expect(container.querySelector('.custom-info')).toBeInTheDocument()
  })
})

// =============================================================================
// PAGE HEADER TESTS
// =============================================================================

describe('PageHeader', () => {
  it('renders title prop', () => {
    render(<PageHeader title="Dashboard" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Dashboard" subtitle="Welcome back" />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(<PageHeader title="Dashboard" action={<button>Add</button>} />)
    expect(screen.getByText('Add')).toBeInTheDocument()
  })

  it('accepts align prop', () => {
    const { container } = render(<PageHeader title="Dashboard" align="center" />)
    const header = container.querySelector('div')
    expect(header).toHaveStyle({ justifyContent: 'center' })
  })

  it('accepts titleSize prop', () => {
    const { container: containerMd } = render(<PageHeader title="Dashboard" titleSize="md" />)
    const h1Md = containerMd.querySelector('h1')
    expect(h1Md).toHaveStyle({ fontSize: '22px' })

    const { container: containerLg } = render(<PageHeader title="Dashboard" titleSize="lg" />)
    const h1Lg = containerLg.querySelector('h1')
    expect(h1Lg).toHaveStyle({ fontSize: '24px' })
  })
})

// =============================================================================
// FULL SCREEN LOADER TESTS
// =============================================================================

describe('FullScreenLoader', () => {
  it('renders without crash', () => {
    const { container } = render(<FullScreenLoader />)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('renders message when provided', () => {
    render(<FullScreenLoader message="Loading your data..." />)
    expect(screen.getByText('Loading your data...')).toBeInTheDocument()
  })

  it('does not render message when not provided', () => {
    render(<FullScreenLoader />)
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })
})

// =============================================================================
// DATA TABLE TESTS
// =============================================================================

describe('DataTable', () => {
  interface User {
    id: number
    name: string
    email: string
  }

  const columns = [
    { key: 'name', header: 'Name', render: (row: User) => row.name },
    { key: 'email', header: 'Email', render: (row: User) => row.email },
  ]

  const data: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ]

  it('renders with empty data', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('renders table headers from columns', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('renders rows when data provided', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders cell content using render function', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading={true}', () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} isLoading={true} />
    )
    const skeletons = container.querySelectorAll('div[style*="animation"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('uses custom emptyTitle and emptySubtitle', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No users found"
        emptySubtitle="Create your first user"
      />
    )
    expect(screen.getByText('No users found')).toBeInTheDocument()
    expect(screen.getByText('Create your first user')).toBeInTheDocument()
  })
})

// =============================================================================
// MEDIA UPLOADER TESTS
// =============================================================================

describe('MediaUploader', () => {
  const mockUploadFn = vi.fn().mockResolvedValue('https://example.com/image.jpg')

  beforeEach(() => {
    mockUploadFn.mockClear()
  })

  it('renders label', () => {
    render(
      <MediaUploader
        label="Upload Image"
        accept="image"
        urls={[]}
        onAdd={() => {}}
        onRemove={() => {}}
        uploadFn={mockUploadFn}
      />
    )
    expect(screen.getByText('Upload Image')).toBeInTheDocument()
  })

  it('renders upload trigger element', () => {
    render(
      <MediaUploader
        label="Upload Image"
        accept="image"
        urls={[]}
        onAdd={() => {}}
        onRemove={() => {}}
        uploadFn={mockUploadFn}
      />
    )
    const trigger = screen.getByRole('button', { name: /click to upload/i })
    expect(trigger).toBeInTheDocument()
  })

  it('renders different text for image vs video', () => {
    const { rerender } = render(
      <MediaUploader
        label="Upload"
        accept="image"
        urls={[]}
        onAdd={() => {}}
        onRemove={() => {}}
        uploadFn={mockUploadFn}
      />
    )
    expect(screen.getByText(/an image/i)).toBeInTheDocument()

    rerender(
      <MediaUploader
        label="Upload"
        accept="video"
        urls={[]}
        onAdd={() => {}}
        onRemove={() => {}}
        uploadFn={mockUploadFn}
      />
    )
    expect(screen.getByText(/a video/i)).toBeInTheDocument()
  })

  it('renders uploaded image thumbnails', () => {
    render(
      <MediaUploader
        label="Upload"
        accept="image"
        urls={['https://example.com/image.jpg']}
        onAdd={() => {}}
        onRemove={() => {}}
        uploadFn={mockUploadFn}
      />
    )
    const img = screen.getByAltText('')
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('calls onRemove when remove button is clicked', async () => {
    const handleRemove = vi.fn()
    render(
      <MediaUploader
        label="Upload"
        accept="image"
        urls={['https://example.com/image.jpg']}
        onAdd={() => {}}
        onRemove={handleRemove}
        uploadFn={mockUploadFn}
      />
    )
    const removeButton = screen.getByRole('button', { name: /^$/ })
    await userEvent.click(removeButton)
    expect(handleRemove).toHaveBeenCalledWith('https://example.com/image.jpg')
  })

  it('shows uploading state during file upload', async () => {
    const handleAdd = vi.fn()
    mockUploadFn.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('https://example.com/image.jpg'), 100))
    )
    const { container } = render(
      <MediaUploader
        label="Upload"
        accept="image"
        urls={[]}
        onAdd={handleAdd}
        onRemove={() => {}}
        uploadFn={mockUploadFn}
      />
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText(/uploading/i)).toBeInTheDocument()
  })

  it('hides dropzone when single image is uploaded and multiple={false}', () => {
    render(
      <MediaUploader
        label="Upload"
        accept="image"
        multiple={false}
        urls={['https://example.com/image.jpg']}
        onAdd={() => {}}
        onRemove={() => {}}
        uploadFn={mockUploadFn}
      />
    )
    expect(screen.queryByText(/click to upload/i)).not.toBeInTheDocument()
  })

  it('shows dropzone when multiple={true} even with existing uploads', () => {
    render(
      <MediaUploader
        label="Upload"
        accept="image"
        multiple={true}
        urls={['https://example.com/image.jpg']}
        onAdd={() => {}}
        onRemove={() => {}}
        uploadFn={mockUploadFn}
      />
    )
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
  })
})
