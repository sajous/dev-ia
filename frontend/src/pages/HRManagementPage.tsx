import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface UserRecord {
  id: number
  username: string
  name: string | null
  email: string
  role: string
  created_at: string | null
}

interface UserFormData {
  username: string
  email: string
  password: string
  name: string
  role: string
}

const ADMIN_ROLES = ['OWNER', 'HR_MANAGER']
const PAGE_SIZE = 10

const INITIAL_FORM: UserFormData = {
  username: '',
  email: '',
  password: '',
  name: '',
  role: 'STOCK_STAFF',
}

export default function HRManagementPage() {
  const { isAuthenticated, user, token } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const isAdmin = user && ADMIN_ROLES.includes(user.role)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:8000/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      setUsers(await response.json())
    } catch {
      setError('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!isAdmin) {
      navigate('/dashboard')
      return
    }
    fetchUsers()
  }, [isAuthenticated, isAdmin, navigate, fetchUsers])

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    try {
      const response = await fetch('http://localhost:8000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail ?? 'Erro ao criar usuário.')
      }
      setSuccessMessage('Funcionário contratado com sucesso!')
      setShowForm(false)
      setFormData(INITIAL_FORM)
      await fetchUsers()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar usuário.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) return
    setError(null)
    try {
      const response = await fetch(`http://localhost:8000/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail ?? 'Erro ao deletar usuário.')
      }
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar usuário.')
    }
  }

  const paginatedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(users.length / PAGE_SIZE)

  if (!isAuthenticated || !isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestão de RH</h1>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            + Contratar Funcionário
          </button>
        </div>

        {successMessage && (
          <div role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Contratar Novo Funcionário</h2>
            <form onSubmit={handleCreateUser} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData(d => ({ ...d, username: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(d => ({ ...d, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha Inicial
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(d => ({ ...d, password: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Cargo
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={e => setFormData(d => ({ ...d, role: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="STOCK_STAFF">Estoque</option>
                  <option value="SALES_STAFF">Vendas</option>
                  <option value="HR_MANAGER">RH</option>
                </select>
              </div>
              {formError && (
                <div role="alert" className="col-span-2 text-sm text-red-600">
                  {formError}
                </div>
              )}
              <div className="col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormError(null)
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {formLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Carregando...</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name ?? u.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.role}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
