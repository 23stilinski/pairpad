'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store'
import { auth, matching } from '@/lib/api'

export default function Navigation() {
  const { user, logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [requestCount, setRequestCount] = useState(0)

  const handleLogout = async () => {
    try {
      await auth.logout()
    } catch (error) {
      // Ignore logout errors
    }
    logout()
    window.location.href = '/'
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const loadRequestCount = async () => {
      if (user) {
        try {
          const requests = await matching.getMatchRequests()
          setRequestCount(requests.length)
        } catch (error) {
          // Ignore errors - user might not be authenticated
        }
      }
    }

    loadRequestCount()
  }, [user])

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 font-['DynaPuff',Helvetica,Arial,sans-serif]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="text-[#5d41ab] text-2xl font-bold">
                PairPad
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-[#5d41ab] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-[#5d41ab] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/discover"
                className="text-gray-700 hover:text-[#5d41ab] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Discover
              </Link>
              <Link
                href="/dashboard/matches"
                className="text-gray-700 hover:text-[#5d41ab] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Matches
              </Link>
              <Link
                href="/dashboard/requests"
                className="text-gray-700 hover:text-[#5d41ab] px-3 py-2 rounded-md text-sm font-medium transition-colors relative"
              >
                Requests
                {requestCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#5d41ab] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {requestCount}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard/messages"
                className="text-gray-700 hover:text-[#5d41ab] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Messages
              </Link>
              <Link
                href="/dashboard/coliving"
                className="text-gray-700 hover:text-[#5d41ab] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Co-Living
              </Link>

              <div className="flex items-center space-x-2 ml-4">
                <span className="text-sm text-gray-700 hidden xl:block">
                  Welcome, {user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-[#5d41ab] text-white px-4 xl:px-6 py-2 rounded-full font-medium hover:bg-[#4c2d87] transition-all hover:scale-105 text-sm"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-[#5d41ab] p-2 rounded-md transition-colors"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="text-[#5d41ab] text-xl font-bold">PairPad</div>
            <button
              onClick={closeMobileMenu}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-md transition-colors"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-600">Welcome back,</div>
            <div className="text-lg font-semibold text-gray-900">{user?.username}</div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-4">
            <div className="space-y-1">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#5d41ab] transition-colors"
              >
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0h3m0 0h3m0 0a1 1 0 001-1V10M9 21v-6a1 1 0 011-1h2a1 1 0 011 1v6" />
                </svg>
                Home
              </Link>
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#5d41ab] transition-colors"
              >
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/dashboard/discover"
                onClick={closeMobileMenu}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#5d41ab] transition-colors"
              >
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Discover
              </Link>
              <Link
                href="/dashboard/matches"
                onClick={closeMobileMenu}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#5d41ab] transition-colors"
              >
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Matches
              </Link>
              <Link
                href="/dashboard/requests"
                onClick={closeMobileMenu}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#5d41ab] transition-colors relative"
              >
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Requests
                {requestCount > 0 && (
                  <span className="ml-auto bg-[#5d41ab] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {requestCount}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard/messages"
                onClick={closeMobileMenu}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#5d41ab] transition-colors"
              >
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
              </Link>
              <Link
                href="/dashboard/coliving"
                onClick={closeMobileMenu}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#5d41ab] transition-colors"
              >
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Co-Living
              </Link>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                closeMobileMenu()
                handleLogout()
              }}
              className="w-full bg-[#5d41ab] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#4c2d87] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  )
}