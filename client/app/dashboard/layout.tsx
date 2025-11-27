'use client'

import { useEffect } from 'react'
import Navigation from '@/components/layout/navigation'
import { useAuthStore } from '@/lib/store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-['DynaPuff',Helvetica,Arial,sans-serif]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5d41ab] mx-auto mb-4"></div>
          <p className="text-lg text-[#484848] font-medium">Loading your perfect matches...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>{children}</main>
    </div>
  )
}