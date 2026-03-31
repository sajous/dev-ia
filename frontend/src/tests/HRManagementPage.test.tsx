import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HRManagementPage from '../pages/HRManagementPage'
import * as AuthContextModule from '../context/AuthContext'

const MOCK_USERS = [
  { id: 1, username: 'owner1', name: 'Owner User', email: 'owner@example.com', role: 'OWNER', created_at: null },
  { id: 2, username: 'staff1', name: 'Staff User', email: 'staff@example.com', role: 'STOCK_STAFF', created_at: null },
]

function mockUseAuth(overrides: Partial<ReturnType<typeof AuthContextModule.useAuth>>) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    isAuthenticated: true,
    token: 'mock-token',
    user: { email: 'owner@test.com', role: 'OWNER' },
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <HRManagementPage />
    </MemoryRouter>
  )
}

describe('HRManagementPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_USERS,
    }))
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
  })

  it('renders null when not authenticated', () => {
    mockUseAuth({ isAuthenticated: false, token: null, user: null })
    const { container } = renderPage()
    expect(container.firstChild).toBeNull()
  })

  it('renders null when user lacks admin role', () => {
    mockUseAuth({ user: { email: 'staff@test.com', role: 'STOCK_STAFF' } })
    const { container } = renderPage()
    expect(container.firstChild).toBeNull()
  })

  it('renders the page title for admin', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => expect(screen.getByText('Gestão de RH')).toBeInTheDocument())
  })

  it('renders HR_MANAGER as admin', async () => {
    mockUseAuth({ user: { email: 'hr@test.com', role: 'HR_MANAGER' } })
    renderPage()
    await waitFor(() => expect(screen.getByText('Gestão de RH')).toBeInTheDocument())
  })

  it('renders the hire button', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => expect(screen.getByText('+ Contratar Funcionário')).toBeInTheDocument())
  })

  it('fetches and displays users in the table', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Owner User')).toBeInTheDocument()
      expect(screen.getByText('Staff User')).toBeInTheDocument()
    })
  })

  it('renders user email and role', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('owner@example.com')).toBeInTheDocument()
      expect(screen.getByText('OWNER')).toBeInTheDocument()
    })
  })

  it('shows table headers', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Nome')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Cargo')).toBeInTheDocument()
      expect(screen.getByText('Ações')).toBeInTheDocument()
    })
  })

  it('shows delete buttons for each user', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByText('Deletar').length).toBe(2)
    })
  })

  it('shows empty state when no users', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    mockUseAuth({})
    renderPage()
    await waitFor(() => expect(screen.getByText('Nenhum usuário encontrado.')).toBeInTheDocument())
  })

  it('shows error alert on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    mockUseAuth({})
    renderPage()
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('shows hire form when button is clicked', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('+ Contratar Funcionário'))
    fireEvent.click(screen.getByText('+ Contratar Funcionário'))
    expect(screen.getByText('Contratar Novo Funcionário')).toBeInTheDocument()
  })

  it('hire form has name, username, email, password, role fields', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('+ Contratar Funcionário'))
    fireEvent.click(screen.getByText('+ Contratar Funcionário'))
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha Inicial')).toBeInTheDocument()
    expect(screen.getByLabelText('Cargo')).toBeInTheDocument()
  })

  it('role select does not include OWNER option', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('+ Contratar Funcionário'))
    fireEvent.click(screen.getByText('+ Contratar Funcionário'))
    const roleSelect = screen.getByLabelText('Cargo') as HTMLSelectElement
    const options = Array.from(roleSelect.options).map(o => o.value)
    expect(options).not.toContain('OWNER')
    expect(options).toContain('STOCK_STAFF')
    expect(options).toContain('SALES_STAFF')
    expect(options).toContain('HR_MANAGER')
  })

  it('cancel button hides the hire form', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('+ Contratar Funcionário'))
    fireEvent.click(screen.getByText('+ Contratar Funcionário'))
    fireEvent.click(screen.getByText('Cancelar'))
    expect(screen.queryByText('Contratar Novo Funcionário')).not.toBeInTheDocument()
  })

  it('submitting hire form calls POST /users and refreshes list', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_USERS })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 3, username: 'new', name: 'New', email: 'new@test.com', role: 'STOCK_STAFF', created_at: null }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [...MOCK_USERS, { id: 3, username: 'new', name: 'New', email: 'new@test.com', role: 'STOCK_STAFF', created_at: null }] })
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('+ Contratar Funcionário'))
    fireEvent.click(screen.getByText('+ Contratar Funcionário'))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'New' } })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'new' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.com' } })
    fireEvent.change(screen.getByLabelText('Senha Inicial'), { target: { value: 'pass123' } })
    await act(async () => {
      fireEvent.click(screen.getByText('Salvar'))
    })
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('shows form error when POST fails', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_USERS })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ detail: 'Email already exists' }) })
    )
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('+ Contratar Funcionário'))
    fireEvent.click(screen.getByText('+ Contratar Funcionário'))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Dup' } })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'dup' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dup@test.com' } })
    fireEvent.change(screen.getByLabelText('Senha Inicial'), { target: { value: 'pass' } })
    await act(async () => {
      fireEvent.click(screen.getByText('Salvar'))
    })
    await waitFor(() => expect(screen.getByText('Email already exists')).toBeInTheDocument())
  })

  it('delete button calls DELETE /users/:id after confirmation', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_USERS })
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_USERS[0] })
      .mockResolvedValueOnce({ ok: true, json: async () => [MOCK_USERS[0]] })
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getAllByText('Deletar'))
    await act(async () => {
      fireEvent.click(screen.getAllByText('Deletar')[0])
    })
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3))
  })

  it('does not delete when confirm is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => MOCK_USERS })
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getAllByText('Deletar'))
    fireEvent.click(screen.getAllByText('Deletar')[0])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('shows error when delete fails', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_USERS })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ detail: 'Cannot delete' }) })
    )
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getAllByText('Deletar'))
    await act(async () => {
      fireEvent.click(screen.getAllByText('Deletar')[0])
    })
    await waitFor(() => expect(screen.getByText('Cannot delete')).toBeInTheDocument())
  })

  it('shows username when name is null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 5, username: 'noname', name: null, email: 'n@n.com', role: 'STOCK_STAFF', created_at: null }],
    }))
    mockUseAuth({})
    renderPage()
    await waitFor(() => expect(screen.getByText('noname')).toBeInTheDocument())
  })

  it('shows pagination when users exceed page size', async () => {
    const manyUsers = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      username: `user${i}`,
      name: `User ${i}`,
      email: `user${i}@test.com`,
      role: 'STOCK_STAFF',
      created_at: null,
    }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => manyUsers }))
    mockUseAuth({})
    renderPage()
    await waitFor(() => expect(screen.getByText('Página 1 de 2')).toBeInTheDocument())
  })

  it('pagination next button advances page', async () => {
    const manyUsers = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      username: `user${i}`,
      name: `User ${i}`,
      email: `user${i}@test.com`,
      role: 'STOCK_STAFF',
      created_at: null,
    }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => manyUsers }))
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('Página 1 de 2'))
    fireEvent.click(screen.getByText('Próxima'))
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
  })

  it('pagination previous button goes back', async () => {
    const manyUsers = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      username: `user${i}`,
      name: `User ${i}`,
      email: `user${i}@test.com`,
      role: 'STOCK_STAFF',
      created_at: null,
    }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => manyUsers }))
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('Página 1 de 2'))
    fireEvent.click(screen.getByText('Próxima'))
    fireEvent.click(screen.getByText('Anterior'))
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
  })

  it('role select onChange updates form data', async () => {
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('+ Contratar Funcionário'))
    fireEvent.click(screen.getByText('+ Contratar Funcionário'))
    const roleSelect = screen.getByLabelText('Cargo') as HTMLSelectElement
    fireEvent.change(roleSelect, { target: { value: 'SALES_STAFF' } })
    expect(roleSelect.value).toBe('SALES_STAFF')
  })

  it('shows fallback error when create response has no detail field', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_USERS })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
    )
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('+ Contratar Funcionário'))
    fireEvent.click(screen.getByText('+ Contratar Funcionário'))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'X' } })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'x' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'x@x.com' } })
    fireEvent.change(screen.getByLabelText('Senha Inicial'), { target: { value: 'x' } })
    await act(async () => { fireEvent.click(screen.getByText('Salvar')) })
    await waitFor(() => expect(screen.getByText('Erro ao criar usuário.')).toBeInTheDocument())
  })

  it('shows fallback error when delete response has no detail field', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_USERS })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
    )
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getAllByText('Deletar'))
    await act(async () => { fireEvent.click(screen.getAllByText('Deletar')[0]) })
    await waitFor(() => expect(screen.getByText('Erro ao deletar usuário.')).toBeInTheDocument())
  })

  it('shows generic error string when create throws non-Error', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_USERS })
      .mockRejectedValueOnce('string error')
    )
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getByText('+ Contratar Funcionário'))
    fireEvent.click(screen.getByText('+ Contratar Funcionário'))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'X' } })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'x' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'x@x.com' } })
    fireEvent.change(screen.getByLabelText('Senha Inicial'), { target: { value: 'x' } })
    await act(async () => { fireEvent.click(screen.getByText('Salvar')) })
    await waitFor(() => expect(screen.getByText('Erro ao criar usuário.')).toBeInTheDocument())
  })

  it('shows generic error string when delete throws non-Error', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_USERS })
      .mockRejectedValueOnce('string error')
    )
    mockUseAuth({})
    renderPage()
    await waitFor(() => screen.getAllByText('Deletar'))
    await act(async () => { fireEvent.click(screen.getAllByText('Deletar')[0]) })
    await waitFor(() => expect(screen.getByText('Erro ao deletar usuário.')).toBeInTheDocument())
  })

  it('shows loading state while fetching', async () => {
    let resolveFetch!: (v: unknown) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise(res => { resolveFetch = res })))
    mockUseAuth({})
    renderPage()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    await act(async () => {
      resolveFetch({ ok: true, json: async () => MOCK_USERS })
    })
    await waitFor(() => expect(screen.queryByText('Carregando...')).not.toBeInTheDocument())
  })
})
