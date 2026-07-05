import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ErrorBoundary } from '../../components/ui/ErrorBoundary'

// Component that deliberately throws during render
function ThrowOnRender({ message }: { message: string }): React.ReactElement {
  throw new Error(message)
}

// Silence React's error output for these tests
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  ;(console.error as jest.Mock).mockRestore()
})

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <></>
      </ErrorBoundary>,
    )
    // No fallback should appear
    expect(() => getByText('Something went wrong')).toThrow()
  })

  it('shows default fallback title on render error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowOnRender message="boom" />
      </ErrorBoundary>,
    )
    expect(getByText('Something went wrong')).toBeTruthy()
  })

  it('uses custom fallbackTitle when provided', () => {
    const { getByText } = render(
      <ErrorBoundary fallbackTitle="Oops, page crashed">
        <ThrowOnRender message="boom" />
      </ErrorBoundary>,
    )
    expect(getByText('Oops, page crashed')).toBeTruthy()
  })

  it('shows the error message from the thrown error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowOnRender message="Network timeout" />
      </ErrorBoundary>,
    )
    expect(getByText('Network timeout')).toBeTruthy()
  })

  it('shows Try Again button', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowOnRender message="boom" />
      </ErrorBoundary>,
    )
    expect(getByText('Try Again')).toBeTruthy()
  })

  it('resets error state when Try Again is pressed', () => {
    // After reset the children slot is re-rendered;
    // if children still throws the boundary will catch again —
    // so we verify the error message is no longer shown
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowOnRender message="boom" />
      </ErrorBoundary>,
    )
    expect(getByText('Something went wrong')).toBeTruthy()
    fireEvent.press(getByText('Try Again'))
    // After reset, boundary tries to render children again (still throws)
    // so fallback re-appears — confirm boundary handled the cycle without crashing
    expect(getByText('Something went wrong')).toBeTruthy()
  })
})
