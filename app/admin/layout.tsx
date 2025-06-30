'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Settings } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/check-auth')
      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        if (pathname !== '/admin/login') {
          router.push('/admin/login')
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      if (pathname !== '/admin/login') {
        router.push('/admin/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' })
      setIsAuthenticated(false)
      toast.success('Logout realizado com sucesso')
      router.push('/admin/login')
    } catch (error) {
      console.error('Erro no logout:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return null
  }

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Usuários', icon: '👥' },
    { href: '/admin/premium-management', label: 'Premium', icon: '💎' },
    { href: '/admin/notifications', label: 'Notificações', icon: '🔔' },
    { href: '/admin/reports', label: 'Denúncias', icon: '🚨' },
    { href: '/admin/pending-content', label: 'Conteúdo Pendente', icon: '⏳' },
    { href: '/admin/blog', label: 'Blog', icon: '📝' },
    { href: '/admin/blog-settings', label: 'Configurações do Blog', icon: '⚙️' },
    { href: '/admin/blog-sections', label: 'Seções do Blog', icon: '📚' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Bebaby Admin</h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === item.href
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 