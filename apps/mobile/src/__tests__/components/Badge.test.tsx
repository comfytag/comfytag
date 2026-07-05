import React from 'react'
import { render } from '@testing-library/react-native'
import { Badge } from '../../components/ui/Badge'

describe('Badge', () => {
  it('renders the label text', () => {
    const { getByText } = render(<Badge label="Live" variant="live" />)
    expect(getByText('Live')).toBeTruthy()
  })

  it('renders every built-in variant without crashing', () => {
    const variants = [
      'upcoming', 'live', 'ended', 'draft', 'soldOut',
      'trending', 'sellingFast', 'free', 'verified',
      'pending', 'approved', 'rejected', 'sent',
    ] as const
    variants.forEach((variant) => {
      expect(() =>
        render(<Badge label={variant} variant={variant} />),
      ).not.toThrow()
    })
  })

  it('renders custom variant with provided label', () => {
    const { getByText } = render(
      <Badge
        label="VIP Only"
        variant="custom"
        customBg="#FFD700"
        customText="#000000"
      />,
    )
    expect(getByText('VIP Only')).toBeTruthy()
  })

  it('renders sm and md sizes without crashing', () => {
    expect(() =>
      render(<Badge label="Sm" size="sm" />),
    ).not.toThrow()
    expect(() =>
      render(<Badge label="Md" size="md" />),
    ).not.toThrow()
  })
})
