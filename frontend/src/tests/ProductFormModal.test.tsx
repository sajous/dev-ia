import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductFormModal from '../components/stock/ProductFormModal'

describe('ProductFormModal', () => {
  it('does not render when isOpen is false', () => {
    render(<ProductFormModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(<ProductFormModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders the modal title', () => {
    render(<ProductFormModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Novo Produto')).toBeInTheDocument()
  })

  it('renders all form fields', () => {
    render(<ProductFormModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByLabelText('Nome do Produto')).toBeInTheDocument()
    expect(screen.getByLabelText('Categoria')).toBeInTheDocument()
    expect(screen.getByLabelText('Preço (R$)')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument()
  })

  it('renders Salvar and Cancelar buttons', () => {
    render(<ProductFormModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('calls onClose when Cancelar is clicked', () => {
    const onClose = vi.fn()
    render(<ProductFormModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('updates name field on input change', () => {
    render(<ProductFormModal isOpen={true} onClose={vi.fn()} />)
    const nameInput = screen.getByLabelText('Nome do Produto')
    fireEvent.change(nameInput, { target: { value: 'Produto Teste' } })
    expect((nameInput as HTMLInputElement).value).toBe('Produto Teste')
  })

  it('updates category field on select change', () => {
    render(<ProductFormModal isOpen={true} onClose={vi.fn()} />)
    const categorySelect = screen.getByLabelText('Categoria')
    fireEvent.change(categorySelect, { target: { value: 'Bebidas' } })
    expect((categorySelect as HTMLSelectElement).value).toBe('Bebidas')
  })

  it('updates price field on input change', () => {
    render(<ProductFormModal isOpen={true} onClose={vi.fn()} />)
    const priceInput = screen.getByLabelText('Preço (R$)')
    fireEvent.change(priceInput, { target: { value: '9.99' } })
    expect((priceInput as HTMLInputElement).value).toBe('9.99')
  })

  it('updates quantity field on input change', () => {
    render(<ProductFormModal isOpen={true} onClose={vi.fn()} />)
    const qtyInput = screen.getByLabelText('Quantidade')
    fireEvent.change(qtyInput, { target: { value: '50' } })
    expect((qtyInput as HTMLInputElement).value).toBe('50')
  })

  it('logs form data and calls onClose when Salvar is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const onClose = vi.fn()
    render(<ProductFormModal isOpen={true} onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('Nome do Produto'), { target: { value: 'Arroz' } })
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'Alimentos' } })
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '8.90' } })
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(consoleSpy).toHaveBeenCalledWith('Novo produto:', {
      name: 'Arroz',
      category: 'Alimentos',
      price: '8.90',
      quantity: '100',
    })
    expect(onClose).toHaveBeenCalledTimes(1)
    consoleSpy.mockRestore()
  })

  it('renders category options', () => {
    render(<ProductFormModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Alimentos')).toBeInTheDocument()
    expect(screen.getByText('Bebidas')).toBeInTheDocument()
    expect(screen.getByText('Limpeza')).toBeInTheDocument()
    expect(screen.getByText('Higiene')).toBeInTheDocument()
    expect(screen.getByText('Eletrônicos')).toBeInTheDocument()
  })
})
