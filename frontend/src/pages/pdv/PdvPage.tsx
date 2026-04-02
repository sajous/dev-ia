import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface Product {
  id: number
  name: string
  sku: string
  quantity: number
  price_cost: number
}

interface CartItem {
  product: Product
  quantity: number
}

export default function PdvPage() {
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingSale, setLoadingSale] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) navigate('/login')
  }, [isAuthenticated, navigate])

  const fetchProducts = useCallback(
    async (query: string) => {
      setLoadingProducts(true)
      try {
        const url = `http://localhost:8000/products${query ? `?search=${encodeURIComponent(query)}` : ''}`
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
        }
      } finally {
        setLoadingProducts(false)
      }
    },
    [token]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) fetchProducts(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchProducts, isAuthenticated])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId))
      return
    }
    setCart(prev => prev.map(i => (i.product.id === productId ? { ...i, quantity } : i)))
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }

  const total = cart.reduce((sum, i) => sum + i.product.price_cost * i.quantity, 0)

  const finalizeSale = async () => {
    setLoadingSale(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const payload = { items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity })) }
      const res = await fetch('http://localhost:8000/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setCart([])
        setSuccessMessage(`Venda #${data.id} registrada com sucesso! Total: R$ ${Number(data.total_price).toFixed(2)}`)
      } else {
        setErrorMessage(data.detail || 'Erro ao finalizar venda.')
      }
    } catch {
      setErrorMessage('Erro de conexão ao finalizar venda.')
    } finally {
      setLoadingSale(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-indigo-400">Terminal PDV</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-200">Buscar Produto</h2>
            <input
              type="text"
              placeholder="Nome ou SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-indigo-500 mb-3"
              aria-label="Buscar produto"
            />

            {loadingProducts && <p className="text-gray-400 text-sm">Buscando...</p>}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between bg-gray-700 rounded p-3"
                >
                  <div>
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.sku} · Estoque: {product.quantity}</p>
                    <p className="text-sm text-indigo-300">R$ {Number(product.price_cost).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.quantity === 0}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                    aria-label={`Adicionar ${product.name} ao carrinho`}
                  >
                    + Adicionar
                  </button>
                </div>
              ))}
              {!loadingProducts && products.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">Nenhum produto encontrado.</p>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-3 text-gray-200">Carrinho</h2>

            {successMessage && (
              <div role="status" className="mb-3 p-3 bg-green-800 border border-green-600 rounded text-green-200 text-sm">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div role="alert" className="mb-3 p-3 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="flex-1 space-y-2 max-h-72 overflow-y-auto mb-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between bg-gray-700 rounded p-3">
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{item.product.name}</p>
                    <p className="text-xs text-indigo-300">
                      R$ {Number(item.product.price_cost).toFixed(2)} × {item.quantity} = R${' '}
                      {(item.product.price_cost * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 bg-gray-600 hover:bg-gray-500 rounded text-center font-bold leading-none"
                      aria-label={`Diminuir quantidade de ${item.product.name}`}
                    >
                      −
                    </button>
                    <span className="text-white w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 bg-gray-600 hover:bg-gray-500 rounded text-center font-bold leading-none"
                      aria-label={`Aumentar quantidade de ${item.product.name}`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="ml-1 text-red-400 hover:text-red-300 text-sm"
                      aria-label={`Remover ${item.product.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">Carrinho vazio.</p>
              )}
            </div>

            <div className="border-t border-gray-600 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-200">Total</span>
                <span className="text-2xl font-bold text-indigo-400">R$ {total.toFixed(2)}</span>
              </div>
              <button
                onClick={finalizeSale}
                disabled={cart.length === 0 || loadingSale}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
                aria-label="Finalizar venda"
              >
                {loadingSale ? 'Processando...' : 'Finalizar Venda'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
