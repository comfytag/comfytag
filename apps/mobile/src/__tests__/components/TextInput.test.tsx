import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TextInput } from '../../components/ui/TextInput'

describe('TextInput', () => {
  it('renders the label', () => {
    const { getByText } = render(
      <TextInput label="Email" placeholder="Enter email" />,
    )
    expect(getByText('Email')).toBeTruthy()
  })

  it('renders placeholder text', () => {
    const { getByPlaceholderText } = render(
      <TextInput placeholder="Enter email" />,
    )
    expect(getByPlaceholderText('Enter email')).toBeTruthy()
  })

  it('shows error text when error prop is set', () => {
    const { getByText } = render(
      <TextInput placeholder="Email" error="Email is required" />,
    )
    expect(getByText('Email is required')).toBeTruthy()
  })

  it('shows hint text when no error', () => {
    const { getByText } = render(
      <TextInput placeholder="Email" hint="We'll never share your email" />,
    )
    expect(getByText("We'll never share your email")).toBeTruthy()
  })

  it('hides hint when error is set', () => {
    const { queryByText } = render(
      <TextInput
        placeholder="Email"
        hint="Helpful hint"
        error="Something's wrong"
      />,
    )
    expect(queryByText('Helpful hint')).toBeNull()
    expect(queryByText("Something's wrong")).toBeTruthy()
  })

  it('shows Show/Hide toggle when secureToggle is true', () => {
    const { getByText } = render(
      <TextInput placeholder="Password" secureToggle secureTextEntry />,
    )
    expect(getByText('Show')).toBeTruthy()
  })

  it('toggles Show/Hide label when tapped', () => {
    const { getByText } = render(
      <TextInput placeholder="Password" secureToggle secureTextEntry />,
    )
    fireEvent.press(getByText('Show'))
    expect(getByText('Hide')).toBeTruthy()
    fireEvent.press(getByText('Hide'))
    expect(getByText('Show')).toBeTruthy()
  })

  it('calls onChangeText when text is entered', () => {
    const onChangeText = jest.fn()
    const { getByPlaceholderText } = render(
      <TextInput placeholder="Name" onChangeText={onChangeText} />,
    )
    fireEvent.changeText(getByPlaceholderText('Name'), 'Chidi')
    expect(onChangeText).toHaveBeenCalledWith('Chidi')
  })
})
