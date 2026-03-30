import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StockDashboard from '../pages/StockDashboard'

describe('StockDashboard', () => {
  it('renders the page title', () => {
    render(<StockDashboard />)
    expect(screen.getByText('Dashboard de Estoque')).toBeInTheDocument()
  })

  it('renders table column headers', () => {
    render(<StockDashboard />)
    expect(screen.getByText('Nome')).toBeInTheDocument()
    expect(screen.getByText('Categoria')).toBeInTheDocument()
    expect(screen.getByText('Preço')).toBeInTheDocument()
    expect(screen.getByText('Quantidade')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders mock products in the table', () => {
    render(<StockDashboard />)
    expect(screen.getByText('Arroz Integral 1kg')).toBeInTheDocument()
    expect(screen.getByText('Feijão Carioca 1kg')).toBeInTheDocument()
    expect(screen.getByText('Água Mineral 1,5L')).toBeInTheDocument()
  })

  it('renders status badges correctly', () => {
    render(<StockDashboard />)
    expect(screen.getAllByText('Em Estoque').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Estoque Baixo').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sem Estoque').length).toBeGreaterThan(0)
  })

  it('filters products by name', () => {
    render(<StockDashboard />)
    const nameInput = screen.getByLabelText('Filtrar por nome')
    fireEvent.change(nameInput, { target: { value: 'Arroz' } })
    expect(screen.getByText('Arroz Integral 1kg')).toBeInTheDocument()
    expect(screen.queryByText('Feijão Carioca 1kg')).not.toBeInTheDocument()
  })

  it('filters products by name case-insensitively', () => {
    render(<StockDashboard />)
    const nameInput = screen.getByLabelText('Filtrar por nome')
    fireEvent.change(nameInput, { target: { value: 'arroz' } })
    expect(screen.getByText('Arroz Integral 1kg')).toBeInTheDocument()
  })

  it('filters products by category', () => {
    render(<StockDashboard />)
    const categorySelect = screen.getByLabelText('Filtrar por categoria')
    fireEvent.change(categorySelect, { target: { value: 'Bebidas' } })
    expect(screen.getByText('Água Mineral 1,5L')).toBeInTheDocument()
    expect(screen.getByText('Refrigerante 2L')).toBeInTheDocument()
    expect(screen.queryByText('Arroz Integral 1kg')).not.toBeInTheDocument()
  })

  it('shows empty state when no products match filters', () => {
    render(<StockDashboard />)
    const nameInput = screen.getByLabelText('Filtrar por nome')
    fireEvent.change(nameInput, { target: { value: 'produto inexistente xyz' } })
    expect(screen.getByText('Nenhum produto encontrado.')).toBeInTheDocument()
  })

  it('renders Novo Produto button', () => {
    render(<StockDashboard />)
    expect(screen.getByRole('button', { name: /Novo Produto/i })).toBeInTheDocument()
  })

  it('opens modal when Novo Produto button is clicked', () => {
    render(<StockDashboard />)
    const btn = screen.getByRole('button', { name: /Novo Produto/i })
    fireEvent.click(btn)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Novo Produto')).toBeInTheDocument()
  })

  it('closes modal when onClose is called via Cancelar', () => {
    render(<StockDashboard />)
    fireEvent.click(screen.getByRole('button', { name: /Novo Produto/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows name filter input with correct placeholder', () => {
    render(<StockDashboard />)
    expect(screen.getByPlaceholderText('Buscar por nome...')).toBeInTheDocument()
  })

  it('applies both name and category filters simultaneously', () => {
    render(<StockDashboard />)
    const nameInput = screen.getByLabelText('Filtrar por nome')
    const categorySelect = screen.getByLabelText('Filtrar por categoria')
    fireEvent.change(categorySelect, { target: { value: 'Bebidas' } })
    fireEvent.change(nameInput, { target: { value: 'Água' } })
    expect(screen.getByText('Água Mineral 1,5L')).toBeInTheDocument()
    expect(screen.queryByText('Refrigerante 2L')).not.toBeInTheDocument()
  })

  it('modal is not rendered initially', () => {
    render(<StockDashboard />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('console.log spy receives product data when Salvar is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    render(<StockDashboard />)
    fireEvent.click(screen.getByRole('button', { name: /Novo Produto/i }))
    fireEvent.change(screen.getByLabelText('Nome do Produto'), { target: { value: 'Teste' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(consoleSpy).toHaveBeenCalledWith('Novo produto:', expect.objectContaining({ name: 'Teste' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    consoleSpy.mockRestore()
  })
})
