import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const user = useAuthStore(state => state.user)
  const loadUser = useAuthStore(state => state.loadUser)
  const navigate = useNavigate()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">加载中...</div>
    </div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}