'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
import { auth } from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const login = useAuthStore((state) => state.login)

  const handleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { user } = await auth.login(email, password)
      login(user)
      toast.success(`Welcome back, ${user.username}!`)

      if (user.personalityProfile) {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/personality/assessment'
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Invalid email or password'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-[#5d41ab] text-2xl font-bold">
              PairPad
            </Link>
            <div className="flex gap-4">
              <Link href="/register">
                <button className="bg-[#5d41ab] text-white px-6 py-2 rounded-full font-medium hover:bg-[#4c2d87] transition-all hover:scale-105">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex justify-center min-h-[80vh] items-center">
          {/* Login Form */}
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-bold text-[#484848] mb-4">
                Welcome back to
                <span className="text-[#5d41ab] block">PairPad</span>
              </h1>
              <p className="text-xl text-[#484848] font-light">
                Sign in to find your perfect roommate match
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      ref={emailInputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all pr-16"
                    />
                    <button
                      type="button"
                      onClick={handleShowPassword}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9ca299] hover:text-[#5d41ab] transition-colors"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#5d41ab] text-white py-4 rounded-2xl font-medium text-lg hover:bg-[#4c2d87] transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="text-center">
                  <Link href="/register" className="text-[#9ca299] hover:text-[#5d41ab] transition-colors">
                    Don't have an account? <span className="font-medium">Sign up</span>
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}