import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6IlNUT0NLX1NUQUZGIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature'

function TestConsumer() {
  const { isAuthenticated, user, token, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email ?? ''}</span>
      <span data-testid="role">{user?.role ?? ''}</span>
      <span data-testid="token">{token ?? ''}</span>
      <button onClick={() => login('a@b.com', 'pass')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts unauthenticated when no token in storage', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(screen.getByTestId('auth').textContent).toBe('false')
    expect(screen.getByTestId('email').textContent).toBe('')
  })

  it('restores state from localStorage on mount', () => {
    localStorage.setItem('token', MOCK_TOKEN)
    localStorage.setItem('user', JSON.stringify({ email: 'a@b.com', role: 'STOCK_STAFF' }))
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(screen.getByTestId('auth').textContent).toBe('true')
    expect(screen.getByTestId('email').textContent).toBe('a@b.com')
    expect(screen.getByTestId('role').textContent).toBe('STOCK_STAFF')
  })

  it('login sets token and user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: MOCK_TOKEN, token_type: 'bearer' }),
    }))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByText('Login').click()
    })

    expect(screen.getByTestId('auth').textContent).toBe('true')
    expect(screen.getByTestId('email').textContent).toBe('a@b.com')
    expect(localStorage.getItem('token')).toBe(MOCK_TOKEN)
  })

  it('login throws on failed response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Invalid credentials' }),
    }))

    let caughtError: Error | null = null

    function ThrowingConsumer() {
      const { login } = useAuth()
      return (
        <button
          onClick={async () => {
            try {
              await login('bad@b.com', 'wrong')
            } catch (e) {
              caughtError = e as Error
            }
          }}
        >
          TryLogin
        </button>
      )
    }

    render(
      <AuthProvider>
        <ThrowingConsumer />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByText('TryLogin').click()
    })

    expect(caughtError).not.toBeNull()
    expect(caughtError!.message).toBe('Invalid credentials')
  })

  it('logout clears token and user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: MOCK_TOKEN, token_type: 'bearer' }),
    }))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByText('Login').click()
    })

    act(() => {
      screen.getByText('Logout').click()
    })

    expect(screen.getByTestId('auth').textContent).toBe('false')
    expect(screen.getByTestId('email').textContent).toBe('')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('login sets empty role when token has no role field', async () => {
    const tokenNoRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: tokenNoRole, token_type: 'bearer' }),
    }))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByText('Login').click()
    })

    expect(screen.getByTestId('role').textContent).toBe('')
  })

  it('useAuth throws when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow()
    consoleError.mockRestore()
  })
})
