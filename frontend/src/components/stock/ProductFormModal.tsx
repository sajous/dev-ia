import { useState } from 'react'

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ProductFormData {
  name: string
  category: string
  price: string
  quantity: string
}

export default function ProductFormModal({ isOpen, onClose }: ProductFormModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    price: '',
    quantity: '',
  })

  if (!isOpen) return null

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSave() {
    console.log('Novo produto:', formData)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="modal-title" className="mb-5 text-xl font-semibold text-gray-800">
          Novo Produto
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Nome do Produto
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Ex: Arroz Integral 1kg"
            />
          </div>

          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Selecione uma categoria</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Limpeza">Limpeza</option>
              <option value="Higiene">Higiene</option>
              <option value="Eletrônicos">Eletrônicos</option>
            </select>
          </div>

          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
              Preço (R$)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-gray-700">
              Quantidade
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="0"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
