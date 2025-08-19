// Layout component for Dashboard CRurales
// Migrated from dashboard_afiliados with exact styling

import React, { useState } from 'react'
import { BarChart3, Users, Menu, X } from 'lucide-react'
import ErrorBoundary from '../common/ErrorBoundary'

interface LayoutProps {
  children: React.ReactNode
  currentPage?: 'analytics' | 'hierarchy'
  onPageChange?: (page: 'analytics' | 'hierarchy') => void
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage = 'analytics',
  onPageChange
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Analytics', key: 'analytics', icon: BarChart3 },
    { name: 'Tabla Jerárquica', key: 'hierarchy', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <h2 className="text-lg font-semibold text-primary">Dashboard CRurales</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-4">
            {navigation.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  if (onPageChange) {
                    onPageChange(item.key as 'analytics' | 'hierarchy')
                  }
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${currentPage === item.key
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-2 pb-4 shadow-xs">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-primary">Dashboard CRurales</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.key}>
                      <button
                        onClick={() => {
                          if (onPageChange) {
                            onPageChange(item.key as 'analytics' | 'hierarchy')
                          }
                        }}
                        className={`w-full flex items-center gap-x-3 rounded-md px-2 py-2 text-sm font-semibold transition-colors ${currentPage === item.key
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-2 border-b border-gray-200 bg-white px-2 shadow-xs sm:gap-x-3 sm:px-3 lg:px-4">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-2 self-stretch lg:gap-x-3">
            <div className="flex flex-1 items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentPage === 'analytics' ? 'Analytics' : 'Jerarquía'}
              </h2>
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="pl-2 pr-0 sm:pl-3 sm:pr-0 lg:pl-4 lg:pr-0">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout