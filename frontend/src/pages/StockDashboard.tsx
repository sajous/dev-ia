import { useState, useMemo } from 'react'
import ProductFormModal from '../components/stock/ProductFormModal'

interface Product {
  id: number
  name: string
  category: string
  price: number
  quantity: number
}

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Arroz Integral 1kg', category: 'Alimentos', price: 8.9, quantity: 150 },
  { id: 2, name: 'Feijão Carioca 1kg', category: 'Alimentos', price: 6.5, quantity: 5 },
  { id: 3, name: 'Água Mineral 1,5L', category: 'Bebidas', price: 2.5, quantity: 200 },
  { id: 4, name: 'Detergente 500ml', category: 'Limpeza', price: 3.2, quantity: 0 },
  { id: 5, name: 'Sabonete Dove', category: 'Higiene', price: 4.75, quantity: 80 },
  { id: 6, name: 'Refrigerante 2L', category: 'Bebidas', price: 9.9, quantity: 3 },
]

const CATEGORIES = ['Todas', 'Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Eletrônicos']

function getStockStatus(quantity: number): { label: string; className: string } {
  if (quantity === 0) return { label: 'Sem Estoque', className: 'bg-red-100 text-red-700' }
  if (quantity <= 10) return { label: 'Estoque Baixo', className: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Em Estoque', className: 'bg-green-100 text-green-700' }
}

export default function StockDashboard() {
  const [nameFilter, setNameFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(product => {
      const matchesName = product.name.toLowerCase().includes(nameFilter.toLowerCase())
      const matchesCategory =
        categoryFilter === 'Todas' || product.category === categoryFilter
      return matchesName && matchesCategory
    })
  }, [nameFilter, categoryFilter])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Estoque</h1>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            + Novo Produto
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
            aria-label="Filtrar por nome"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:max-w-xs"
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoria"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const status = getStockStatus(product.quantity)
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        R$ {product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.quantity}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
