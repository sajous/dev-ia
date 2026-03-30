import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated || !user) {
    return null
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}! Your role is: {user.role}</p>
      <button onClick={handleLogout}>Logout</button>
    </main>
  )
}
