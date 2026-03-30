import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import DashboardPage from '../pages/DashboardPage'

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6IlNUT0NLX1NUQUZGJ9.signature'

function renderDashboard(authenticated = false) {
  if (authenticated) {
    localStorage.setItem('token', MOCK_TOKEN)
    localStorage.setItem('user', JSON.stringify({ email: 'user@example.com', role: 'STOCK_STAFF' }))
  }

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<div>LoginPage</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('redirects to login when not authenticated', async () => {
    renderDashboard(false)
    await waitFor(() => {
      expect(screen.getByText('LoginPage')).toBeInTheDocument()
    })
  })

  it('shows welcome message when authenticated', () => {
    renderDashboard(true)
    expect(screen.getByText(/Welcome, user@example.com/)).toBeInTheDocument()
    expect(screen.getByText(/STOCK_STAFF/)).toBeInTheDocument()
  })

  it('shows logout button when authenticated', () => {
    renderDashboard(true)
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
  })

  it('logout clears state and redirects to login', async () => {
    renderDashboard(true)
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    await waitFor(() => {
      expect(screen.getByText('LoginPage')).toBeInTheDocument()
    })
    expect(localStorage.getItem('token')).toBeNull()
  })
})
