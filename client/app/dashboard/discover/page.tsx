'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuthStore, useMatchStore } from '@/lib/store'
import { matching } from '@/lib/api'
import { User } from '@/lib/utils'

export default function DiscoverPage() {
  const { user, checkAuth } = useAuthStore()
  const { suggestedMatches, setSuggestedMatches, addMatch } = useMatchStore()
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Refresh user data to ensure we have the latest personality profile
        await checkAuth()
      } catch (error) {
        console.error('Failed to refresh user data:', error)
      }
    }

    loadData()
  }, [checkAuth])

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        if (user.personalityProfile) {
          const suggestions = await matching.getSuggestions()
          setSuggestedMatches(suggestions)
        }
      } catch (error) {
        console.error('Failed to load suggestions:', error)
        if (user.personalityProfile) {
          toast.error('Failed to load match suggestions')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadSuggestions()
  }, [user, setSuggestedMatches])

  const handleAcceptMatch = async (matchUser: User) => {
    setActionLoading(matchUser.id)
    try {
      const match = await matching.acceptMatch(matchUser.id)
      addMatch(match)
      // Remove from suggestions
      setSuggestedMatches(suggestedMatches.filter(u => u.id !== matchUser.id))

      if (match.status === 'mutual') {
        toast.success(`🎉 It's a match with ${matchUser.username}! You can now start chatting.`)
      } else {
        toast.success(`❤️ You liked ${matchUser.username}!`)
      }
    } catch (error) {
      console.error('Failed to accept match:', error)
      toast.error('Failed to like this user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectMatch = async (matchUser: User) => {
    setActionLoading(matchUser.id)
    try {
      await matching.rejectMatch(matchUser.id)
      // Remove from suggestions
      setSuggestedMatches(suggestedMatches.filter(u => u.id !== matchUser.id))
      toast.success(`👎 Passed on ${matchUser.username}`)
    } catch (error) {
      console.error('Failed to reject match:', error)
      toast.error('Failed to pass on this user')
    } finally {
      setActionLoading(null)
    }
  }

  const renderScoreBreakdown = (scoreBreakdown: any) => {
    if (!scoreBreakdown) return null

    const categories = [
      { name: 'Lifestyle Match', value: scoreBreakdown.lifestyle, icon: '🏠' },
      { name: 'Basic Preferences', value: scoreBreakdown.basic_lifestyle, icon: '⭐' },
      { name: 'Personality Fit', value: scoreBreakdown.personality, icon: '🧠' },
      { name: 'Communication', value: scoreBreakdown.communication, icon: '💬' },
      { name: 'Location', value: scoreBreakdown.location, icon: '📍' },
    ]

    return (
      <div className="space-y-3">
        <h4 className="font-bold text-[#484848] mb-4">Compatibility Breakdown</h4>
        {categories.map((category) => (
          <div key={category.name} className="space-y-1">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-[#484848]">
                {category.icon} {category.name}
              </span>
              <span className={`font-bold ${
                category.value >= 80 ? 'text-green-600' :
                category.value >= 60 ? 'text-orange-500' :
                'text-[#5d41ab]'
              }`}>
                {category.value}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  category.value >= 80 ? 'bg-green-600' :
                  category.value >= 60 ? 'bg-orange-500' :
                  'bg-[#5d41ab]'
                }`}
                style={{ width: `${category.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )
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
            Discover Your
            <span className="text-[#5d41ab] block">Perfect Match</span>
          </h1>
          <p className="text-xl text-[#484848] font-light">
            Swipe through roommates who are scientifically compatible with you
          </p>
        </div>

        {!user?.personalityProfile ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#484848] mb-4">
                Complete Your Profile First
              </h3>
              <p className="text-gray-600 mb-6">
                Take our personality assessment to get personalized matches
              </p>
              <Link href="/personality/assessment">
                <button className="bg-[#5d41ab] text-white px-8 py-4 rounded-2xl font-medium text-lg hover:bg-[#4c2d87] transition-all hover:scale-105 shadow-lg hover:shadow-xl">
                  Take Assessment
                </button>
              </Link>
            </div>
          </div>
        ) : suggestedMatches.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#484848] mb-4">
                No Suggestions Yet
              </h3>
              <p className="text-gray-600">
                We're working on finding compatible roommates for you. Check back soon!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {suggestedMatches.map((matchUser) => {
              const compatibilityScore = matchUser.compatibility_score || 0
              const similarityScore = matchUser.similarity_score || compatibilityScore

              return (
                <div key={matchUser.id} className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-6">
                    {/* User Info Section */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-[#484848] mb-1">
                            {matchUser.fullName || matchUser.username}
                          </h3>
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

                      {/* Budget & Lease Info */}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {matchUser.budget_min && matchUser.budget_max && (
                          <div className="text-sm">
                            <span className="text-gray-500">Budget:</span>
                            <span className="ml-1 font-medium text-[#484848]">
                              ${matchUser.budget_min}-${matchUser.budget_max}
                            </span>
                          </div>
                        )}
                        {matchUser.lease_duration && (
                          <div className="text-sm">
                            <span className="text-gray-500">Lease:</span>
                            <span className="ml-1 font-medium text-[#484848] capitalize">
                              {matchUser.lease_duration.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                        {matchUser.move_in_date && (
                          <div className="text-sm">
                            <span className="text-gray-500">Move-in:</span>
                            <span className="ml-1 font-medium text-[#484848]">
                              {new Date(matchUser.move_in_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {matchUser.personalityProfile?.communicationStyle && (
                          <div className="text-sm">
                            <span className="text-gray-500">Style:</span>
                            <span className="ml-1 font-medium text-[#484848] capitalize">
                              {matchUser.personalityProfile.communicationStyle}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score Section */}
                    <div className="lg:w-80 flex-shrink-0">
                      <div className="bg-gradient-to-br from-[#5d41ab] to-[#4c2d87] rounded-2xl p-6 text-white mb-4">
                        <div className="text-center mb-4">
                          <div className="text-5xl font-bold mb-2">
                            {compatibilityScore}%
                          </div>
                          <div className="text-sm opacity-90">Compatibility Score</div>
                        </div>
                        {similarityScore !== compatibilityScore && (
                          <div className="text-center border-t border-white/20 pt-3">
                            <div className="text-2xl font-bold">{similarityScore}%</div>
                            <div className="text-xs opacity-80">Similarity Score</div>
                          </div>
                        )}
                      </div>

                      {matchUser.score_breakdown && renderScoreBreakdown(matchUser.score_breakdown)}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAcceptMatch(matchUser)}
                      disabled={actionLoading === matchUser.id}
                      className="flex-1 bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105 disabled:opacity-50"
                    >
                      {actionLoading === matchUser.id ? 'Processing...' : '❤️ Like'}
                    </button>
                    <button
                      onClick={() => handleRejectMatch(matchUser)}
                      disabled={actionLoading === matchUser.id}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      👎 Pass
                    </button>
                    <Link href={`/profile/${matchUser.id}`} className="flex-1">
                      <button className="w-full border-2 border-[#5d41ab] text-[#5d41ab] py-3 rounded-2xl font-medium hover:bg-[#5d41ab] hover:text-white transition-all">
                        View Profile
                      </button>
                    </Link>
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
