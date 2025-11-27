'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore, useMatchStore } from '@/lib/store'
import { matching } from '@/lib/api'
import { calculateCompatibilityScore, User } from '@/lib/utils'
import MySpacesSection from '@/components/dashboard/MySpacesSection'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { suggestedMatches, setSuggestedMatches } = useMatchStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestions = await matching.getSuggestions()
        setSuggestedMatches(suggestions)
      } catch (error) {
        console.error('Failed to load suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSuggestions()
  }, [setSuggestedMatches])

  const renderPersonalityStats = () => {
    if (!user?.personalityProfile) {
      return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-[#484848] mb-4">
              Complete Your Personality Profile
            </h3>
            <p className="text-gray-600 mb-6">
              Take our science-based assessment to discover your perfect roommate matches
            </p>
            <Link href="/personality/assessment">
              <button className="bg-[#5d41ab] text-white px-8 py-4 rounded-2xl font-medium text-lg hover:bg-[#4c2d87] transition-all hover:scale-105 shadow-lg hover:shadow-xl">
                Take Assessment
              </button>
            </Link>
          </div>
        </div>
      )
    }

    const { personalityProfile } = user
    const traits = [
      { name: 'Openness', value: personalityProfile.openness },
      { name: 'Conscientiousness', value: personalityProfile.conscientiousness },
      { name: 'Extraversion', value: personalityProfile.extraversion },
      { name: 'Agreeableness', value: personalityProfile.agreeableness },
      { name: 'Neuroticism', value: personalityProfile.neuroticism },
    ]

    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-[#484848]">
            Your Personality Profile
          </h3>
          <p className="text-gray-600">Based on Big Five personality science</p>
        </div>
        <div className="space-y-6">
          {traits.map((trait) => (
            <div key={trait.name}>
              <div className="flex justify-between items-center text-sm font-medium mb-2">
                <span className="text-[#484848]">{trait.name}</span>
                <span className="text-[#5d41ab] font-bold">{trait.value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-[#5d41ab] transition-all duration-500"
                  style={{ width: `${trait.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRecentMatches = () => (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-[#484848]">
          Your Perfect Matches
        </h3>
        <p className="text-gray-600">People who vibe with your energy</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5d41ab] mx-auto mb-4"></div>
          <p className="text-gray-500">Finding your perfect matches...</p>
        </div>
      ) : suggestedMatches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            Complete your personality assessment to discover amazing roommate matches!
          </p>
          <Link href="/personality/assessment">
            <button className="bg-[#5d41ab] text-white px-6 py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105">
              Get Started
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestedMatches.slice(0, 3).map((match) => {
            // Use API scores if available, otherwise calculate locally
            const compatibilityScore = match.compatibility_score ||
              (user?.personalityProfile && match.personalityProfile
                ? calculateCompatibilityScore(user.personalityProfile, match.personalityProfile)
                : 0)
            const similarityScore = match.similarity_score

            return (
              <div key={match.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#5d41ab] rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {match.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#484848]">{match.username}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {match.role}
                      </p>
                      <div className="flex gap-3 mt-1">
                        <p className="text-sm text-[#5d41ab] font-bold">
                          {compatibilityScore}% match
                        </p>
                        {similarityScore && (
                          <p className="text-sm text-gray-600">
                            {similarityScore}% similar
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href={`/profile/${match.id}`}>
                    <button className="bg-[#5d41ab] text-white px-6 py-2 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105">
                      View Profile
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
          <Link href="/dashboard/matches">
            <button className="w-full border-2 border-[#5d41ab] text-[#5d41ab] py-3 rounded-2xl font-medium hover:bg-[#5d41ab] hover:text-white transition-all">
              View All Matches
            </button>
          </Link>
        </div>
      )}
    </div>
  )

  const renderQuickActions = () => (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-[#484848]">
          Quick Actions
        </h3>
      </div>
      <div className="space-y-3">
        <Link href="/dashboard/matches" className="block">
          <button className="w-full bg-gray-50 border border-gray-200 text-[#484848] py-4 rounded-2xl font-medium hover:bg-[#5d41ab] hover:text-white transition-all">
            Find Your Perfect Match
          </button>
        </Link>
        <Link href="/dashboard/messages" className="block">
          <button className="w-full bg-gray-50 border border-gray-200 text-[#484848] py-4 rounded-2xl font-medium hover:bg-[#5d41ab] hover:text-white transition-all">
            Check Messages
          </button>
        </Link>
        <Link href="/dashboard/coliving" className="block">
          <button className="w-full bg-gray-50 border border-gray-200 text-[#484848] py-4 rounded-2xl font-medium hover:bg-[#5d41ab] hover:text-white transition-all">
            Manage Co-Living
          </button>
        </Link>
        <Link href="/dashboard/profile" className="block">
          <button className="w-full bg-gray-50 border border-gray-200 text-[#484848] py-4 rounded-2xl font-medium hover:bg-[#5d41ab] hover:text-white transition-all">
            Edit Profile
          </button>
        </Link>
        {user && (
          <Link href={`/profile/${user.id}`} className="block">
            <button className="w-full bg-gray-50 border border-gray-200 text-[#484848] py-4 rounded-2xl font-medium hover:bg-[#5d41ab] hover:text-white transition-all">
              View My Public Profile
            </button>
          </Link>
        )}
        <Link href="/personality/assessment" className="block">
          <button className="w-full bg-gray-50 border border-gray-200 text-[#484848] py-4 rounded-2xl font-medium hover:bg-[#5d41ab] hover:text-white transition-all">
            Retake Assessment
          </button>
        </Link>
      </div>
    </div>
  )

  const renderAccountStatus = () => (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-[#484848]">
          Account Status
        </h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[#484848] font-medium">
            Verification:
          </span>
          <span className={`font-bold px-3 py-1 rounded-full text-sm ${
            user?.verificationStatus === 'verified' ? 'bg-green-100 text-green-600' :
            user?.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-600' :
            'bg-red-100 text-red-600'
          }`}>
            {user?.verificationStatus || 'Unknown'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#484848] font-medium">
            Profile:
          </span>
          <span className={`font-bold px-3 py-1 rounded-full text-sm ${
            user?.personalityProfile ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
          }`}>
            {user?.personalityProfile ? 'Complete' : 'Incomplete'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#484848] font-medium">
            Account Type:
          </span>
          <span className="font-bold text-[#5d41ab] capitalize">{user?.role}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#484848] mb-4">
            Welcome back,
            <span className="text-[#5d41ab] block">
              {user?.username}!
            </span>
          </h1>
          <p className="text-xl text-[#484848] font-light">
            Your perfect roommate adventure continues here
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <MySpacesSection />
            {renderPersonalityStats()}
            {renderRecentMatches()}
          </div>

          <div className="space-y-8">
            {renderQuickActions()}
            {renderAccountStatus()}
          </div>
        </div>
      </div>
    </div>
  )
}