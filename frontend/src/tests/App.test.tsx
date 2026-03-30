import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects unknown routes to login', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })
})
