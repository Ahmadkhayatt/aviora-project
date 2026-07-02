"use client"

import { useState } from "react"

interface AdminShellProps {
  children: React.ReactNode
}

export default function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:inset-auto bg-charcoal-900 text-white ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-charcoal-700">
          <h2 className="font-serif text-lg font-bold tracking-wide text-gold-400">
            AVIORA
            <span className="block text-xs font-normal tracking-normal text-gold-200">Admin Panel</span>
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gold-400"
          >
            ×
          </button>
        </div>

        <nav className="px-3 py-4">
          <div className="space-y-1">
            <a
              href="/dashboard"
              className="admin-sidebar-link block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/dashboard/products"
              className="admin-sidebar-link block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Products
            </a>
            <a
              href="/dashboard/barcodes"
              className="admin-sidebar-link block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Barcodes
            </a>
            <a
              href="/dashboard/inventory"
              className="admin-sidebar-link block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Inventory
            </a>
            <a
              href="/dashboard/invoices"
              className="admin-sidebar-link block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Invoices
            </a>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-charcoal-700">
          <a
            href="/"
            className="admin-sidebar-link block px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gold-200 hover:text-gold-400"
          >
            Back to Site
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-charcoal-200 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-charcoal-600 hover:text-charcoal-900"
            >
              ☰
            </button>
            <h2 className="text-lg font-semibold text-charcoal-900">Dashboard</h2>
            <div className="w-8"></div> {/* Spacer for alignment */}
          </div>
        </header>

        <main className="flex-1 bg-charcoal-50 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}