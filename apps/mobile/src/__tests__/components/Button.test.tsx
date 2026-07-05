import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '../../components/ui/Button'

describe('Button', () => {
  it('renders the label', () => {
    const { getByText } = render(<Button label="Continue" onPress={jest.fn()} />)
    expect(getByText('Continue')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Go" onPress={onPress} />)
    fireEvent.press(getByText('Go'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <Button label="Disabled" onPress={onPress} disabled />,
    )
    fireEvent.press(getByText('Disabled'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows ActivityIndicator and hides label when loading', () => {
    const { queryByText, getByTestId, UNSAFE_queryByType } = render(
      <Button label="Submit" onPress={jest.fn()} loading />,
    )
    // Label should not appear while loading
    expect(queryByText('Submit')).toBeNull()
    // ActivityIndicator should be in the tree
    const { ActivityIndicator } = require('react-native')
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy()
  })

  it('does not call onPress when loading', () => {
    const onPress = jest.fn()
    const { UNSAFE_getByType } = render(
      <Button label="Submit" onPress={onPress} loading />,
    )
    const { ActivityIndicator } = require('react-native')
    fireEvent.press(UNSAFE_getByType(ActivityIndicator))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders all variants without crashing', () => {
    const variants = ['primary', 'brand', 'ghost', 'outline', 'danger'] as const
    variants.forEach((variant) => {
      expect(() =>
        render(<Button label={variant} onPress={jest.fn()} variant={variant} />),
      ).not.toThrow()
    })
  })

  it('renders all sizes without crashing', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    sizes.forEach((size) => {
      expect(() =>
        render(<Button label={size} onPress={jest.fn()} size={size} />),
      ).not.toThrow()
    })
  })
})
