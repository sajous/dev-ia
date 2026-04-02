import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PdvPage from '../pages/pdv/PdvPage'
import * as AuthContextModule from '../context/AuthContext'

const MOCK_PRODUCTS = [
  { id: 1, name: 'Arroz', sku: 'ARR-001', quantity: 50, price_cost: 20.0 },
  { id: 2, name: 'Feijão', sku: 'FEI-001', quantity: 30, price_cost: 10.0 },
]

function mockUseAuth(overrides: Partial<ReturnType<typeof AuthContextModule.useAuth>> = {}) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    isAuthenticated: true,
    token: 'mock-token',
    user: { email: 'staff@test.com', role: 'SALES_STAFF' },
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PdvPage />
    </MemoryRouter>
  )
}

describe('PdvPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => MOCK_PRODUCTS })
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders null when not authenticated', () => {
    mockUseAuth({ isAuthenticated: false, token: null, user: null })
    const { container } = renderPage()
    expect(container.firstChild).toBeNull()
  })

  it('renders page title when authenticated', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => expect(screen.getByText('Terminal PDV')).toBeInTheDocument())
  })

  it('renders search input', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => expect(screen.getByLabelText('Buscar produto')).toBeInTheDocument())
  })

  it('renders cart section', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => expect(screen.getByText('Carrinho')).toBeInTheDocument())
  })

  it('renders empty cart message initially', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => expect(screen.getByText('Carrinho vazio.')).toBeInTheDocument())
  })

  it('fetches and displays products on mount', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Arroz')).toBeInTheDocument()
      expect(screen.getByText('Feijão')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('shows product sku and stock', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/ARR-001/)).toBeInTheDocument()
      expect(screen.getByText(/Estoque: 50/)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('shows product price', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('R$ 20.00')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('shows empty state when no products found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    mockUseAuth()
    renderPage()
    await waitFor(() => expect(screen.getByText('Nenhum produto encontrado.')).toBeInTheDocument(), { timeout: 2000 })
  })

  it('fetches products with search query after debounce', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => MOCK_PRODUCTS })
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth()
    renderPage()
    await act(async () => { vi.advanceTimersByTime(400) })
    await act(async () => { await Promise.resolve() })
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const input = screen.getByLabelText('Buscar produto')
    fireEvent.change(input, { target: { value: 'Arroz' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    await act(async () => { await Promise.resolve() })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    const lastCall = mockFetch.mock.calls[1][0] as string
    expect(lastCall).toContain('search=Arroz')
    vi.useRealTimers()
  })

  it('adds product to cart when add button clicked', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    expect(screen.queryByText('Carrinho vazio.')).not.toBeInTheDocument()
  })

  it('increases quantity when adding same product twice', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows total as 0.00 when cart is empty', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => expect(screen.getByText('R$ 0.00')).toBeInTheDocument())
  })

  it('updates total when item added to cart', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    const totals = screen.getAllByText('R$ 20.00')
    expect(totals.length).toBeGreaterThan(0)
  })

  it('removes item from cart when remove button clicked', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    fireEvent.click(screen.getByLabelText('Remover Arroz'))
    expect(screen.getByText('Carrinho vazio.')).toBeInTheDocument()
  })

  it('decreases quantity with minus button', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    fireEvent.click(screen.getByLabelText('Diminuir quantidade de Arroz'))
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('removes item when quantity decremented to zero', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    fireEvent.click(screen.getByLabelText('Diminuir quantidade de Arroz'))
    expect(screen.getByText('Carrinho vazio.')).toBeInTheDocument()
  })

  it('increases quantity with plus button', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    fireEvent.click(screen.getByLabelText('Aumentar quantidade de Arroz'))
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calculates total correctly with multiple items', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    fireEvent.click(screen.getByLabelText('Adicionar Feijão ao carrinho'))
    expect(screen.getByText('R$ 30.00')).toBeInTheDocument()
  })

  it('finalizar venda button is disabled when cart is empty', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => expect(screen.getByLabelText('Finalizar venda')).toBeDisabled())
  })

  it('disables add button for out-of-stock product', async () => {
    const outOfStock = [{ id: 3, name: 'Sem Estoque', sku: 'SEM-001', quantity: 0, price_cost: 5.0 }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => outOfStock }))
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Sem Estoque'), { timeout: 2000 })
    expect(screen.getByLabelText('Adicionar Sem Estoque ao carrinho')).toBeDisabled()
  })

  it('does not fetch when not authenticated', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth({ isAuthenticated: false, token: null, user: null })
    renderPage()
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(mockFetch).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('finalize sale success clears cart and shows success message', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_PRODUCTS })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 42, total_price: '20.00', items: [] }) })
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Finalizar venda'))
    })
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/Venda #42/)).toBeInTheDocument()
      expect(screen.getByText('Carrinho vazio.')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('finalize sale shows error when api returns 400', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_PRODUCTS })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ detail: 'Insufficient stock for Arroz' }) })
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Finalizar venda'))
    })
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Insufficient stock for Arroz')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('finalize sale shows fallback error when detail missing', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_PRODUCTS })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Finalizar venda'))
    })
    await waitFor(() => expect(screen.getByText('Erro ao finalizar venda.')).toBeInTheDocument(), { timeout: 3000 })
  })

  it('finalize sale shows connection error on fetch throw', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_PRODUCTS })
      .mockRejectedValueOnce(new Error('Network error'))
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Finalizar venda'))
    })
    await waitFor(() => expect(screen.getByText('Erro de conexão ao finalizar venda.')).toBeInTheDocument(), { timeout: 3000 })
  })

  it('shows loading indicator while fetching products', async () => {
    vi.useFakeTimers()
    let resolveFetch!: (v: unknown) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise(res => { resolveFetch = res })))
    mockUseAuth()
    renderPage()
    await act(async () => { vi.advanceTimersByTime(400) })
    await act(async () => { await Promise.resolve() })
    expect(screen.getByText('Buscando...')).toBeInTheDocument()
    await act(async () => {
      resolveFetch({ ok: true, json: async () => MOCK_PRODUCTS })
      await Promise.resolve()
      await Promise.resolve()
    })
    vi.useRealTimers()
  })

  it('product fetch failure does not update products list', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_PRODUCTS })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth()
    renderPage()
    await act(async () => { vi.advanceTimersByTime(400) })
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    const input = screen.getByLabelText('Buscar produto')
    fireEvent.change(input, { target: { value: 'X' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(mockFetch).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('add same product with other items in cart covers ternary false branch', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    fireEvent.click(screen.getByLabelText('Adicionar Feijão ao carrinho'))
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('update quantity of one product with multiple cart items', async () => {
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    fireEvent.click(screen.getByLabelText('Adicionar Feijão ao carrinho'))
    fireEvent.click(screen.getByLabelText('Aumentar quantidade de Arroz'))
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('finalizar venda button shows Processando while loading', async () => {
    let resolveSale!: (v: unknown) => void
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_PRODUCTS })
      .mockReturnValueOnce(new Promise(res => { resolveSale = res }))
    vi.stubGlobal('fetch', mockFetch)
    mockUseAuth()
    renderPage()
    await waitFor(() => screen.getByText('Arroz'), { timeout: 2000 })
    fireEvent.click(screen.getByLabelText('Adicionar Arroz ao carrinho'))
    fireEvent.click(screen.getByLabelText('Finalizar venda'))
    await waitFor(() => expect(screen.getByText('Processando...')).toBeInTheDocument(), { timeout: 3000 })
    await act(async () => {
      resolveSale({ ok: true, json: async () => ({ id: 1, total_price: '20.00', items: [] }) })
    })
  })
})
