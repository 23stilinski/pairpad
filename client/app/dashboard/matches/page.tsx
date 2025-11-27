'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuthStore, useMatchStore } from '@/lib/store'
import { matching, sharedDashboard } from '@/lib/api'

interface Match {
  id: number
  other_user: any
  compatibility_score: number
  status: string
  is_primary: boolean
  living_space_id: number | null
  created_at: string
}

export default function MatchesPage() {
  const { user, checkAuth } = useAuthStore()
  const [mutualMatches, setMutualMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        await checkAuth()
      } catch (error) {
        console.error('Failed to refresh user data:', error)
      }
    }

    loadData()
  }, [checkAuth])

  useEffect(() => {
    const loadMatches = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const matches = await matching.getMatches()
        setMutualMatches(matches)
      } catch (error) {
        console.error('Failed to load matches:', error)
        toast.error('Failed to load your matches')
      } finally {
        setIsLoading(false)
      }
    }

    loadMatches()
  }, [user])

  const handleSetPrimary = async (matchId: number, isPrimary: boolean) => {
    try {
      await sharedDashboard.setPrimaryMatch(matchId, isPrimary)
      toast.success(isPrimary ? '⭐ Set as primary match' : 'Removed primary status')

      // Reload matches
      const matches = await matching.getMatches()
      setMutualMatches(matches)
    } catch (error) {
      console.error('Failed to set primary match:', error)
      toast.error('Failed to update primary match')
    }
  }

  const handleUnmatch = async (matchId: number, username: string) => {
    if (!confirm(`Are you sure you want to unmatch with ${username}? This action cannot be undone.`)) {
      return
    }

    try {
      await matching.unmatch(matchId)
      toast.success('Successfully unmatched')

      // Reload matches
      const matches = await matching.getMatches()
      setMutualMatches(matches)
    } catch (error: any) {
      console.error('Failed to unmatch:', error)
      toast.error(error.response?.data?.error || 'Failed to unmatch')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5d41ab] mx-auto"></div>
            <p className="mt-2 text-[#484848]">Finding your perfect matches...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#484848] mb-4">
            Your
            <span className="text-[#5d41ab] block">Matches</span>
          </h1>
          <p className="text-xl text-[#484848] font-light">
            Connect with roommates you've matched with
          </p>
        </div>

        {mutualMatches.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#484848] mb-4">
                No Matches Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start discovering compatible roommates to create your first match
              </p>
              <Link href="/dashboard/discover">
                <button className="bg-[#5d41ab] text-white px-8 py-4 rounded-2xl font-medium text-lg hover:bg-[#4c2d87] transition-all hover:scale-105 shadow-lg hover:shadow-xl">
                  Discover Matches
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {mutualMatches.map((match) => {
              const matchUser = match.other_user

              if (!matchUser) return null

              return (
                <div key={match.id} className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-6">
                    {/* User Info Section */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-[#484848]">
                              {matchUser.fullName || matchUser.username}
                            </h3>
                            {match.is_primary && (
                              <span className="bg-[#5d41ab] text-white text-xs px-3 py-1 rounded-full">
                                ⭐ Primary
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 capitalize mb-2">
                            {matchUser.role} • {matchUser.age ? `${matchUser.age} years old` : ''}
                          </p>
                          <p className="text-sm text-[#484848] mb-2">
                            📍 {matchUser.current_city || 'Location not specified'}
                          </p>
                          {matchUser.occupation && (
                            <p className="text-sm text-gray-600">
                              💼 {matchUser.occupation}
                            </p>
                          )}
                          {matchUser.education && (
                            <p className="text-sm text-gray-600">
                              🎓 {matchUser.education}
                            </p>
                          )}
                        </div>
                      </div>

                      {matchUser.bio && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm text-[#484848]">{matchUser.bio}</p>
                        </div>
                      )}

                      {matchUser.interests && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {matchUser.interests.split(',').map((interest: string, idx: number) => (
                            <span key={idx} className="text-xs bg-[#5d41ab]/10 text-[#5d41ab] px-3 py-1 rounded-full">
                              {interest.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Score Section */}
                    <div className="lg:w-64 flex-shrink-0">
                      <div className="bg-gradient-to-br from-[#5d41ab] to-[#4c2d87] rounded-2xl p-6 text-white">
                        <div className="text-center">
                          <div className="text-5xl font-bold mb-2">
                            {Math.round(match.compatibility_score)}%
                          </div>
                          <div className="text-sm opacity-90">Compatible</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      {match.living_space_id ? (
                        <Link href={`/dashboard/shared/${match.id}`} className="flex-1">
                          <button className="w-full bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105">
                            🏠 Open Shared Dashboard
                          </button>
                        </Link>
                      ) : (
                        <Link href={`/dashboard/shared/${match.id}`} className="flex-1">
                          <button className="w-full bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105">
                            🏠 Create Shared Dashboard
                          </button>
                        </Link>
                      )}
                      <button
                        onClick={() => handleSetPrimary(match.id, !match.is_primary)}
                        className="flex-1 border-2 border-[#5d41ab] text-[#5d41ab] py-3 rounded-2xl font-medium hover:bg-[#5d41ab] hover:text-white transition-all"
                      >
                        {match.is_primary ? '⭐ Remove Primary' : '⭐ Set as Primary'}
                      </button>
                      <Link href={`/profile/${matchUser.id}`} className="flex-1">
                        <button className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-all">
                          View Profile
                        </button>
                      </Link>
                    </div>
                    <button
                      onClick={() => handleUnmatch(match.id, matchUser.fullName || matchUser.username)}
                      className="w-full border-2 border-red-300 text-red-600 py-3 rounded-2xl font-medium hover:bg-red-50 transition-all"
                    >
                      ✕ Unmatch
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}