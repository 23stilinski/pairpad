'use client'

import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore, useMatchStore } from '@/lib/store'
import { calculateCompatibilityScore } from '@/lib/utils'
import { matching } from '@/lib/api'
import { useState } from 'react'

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.userId as string
  const { user } = useAuthStore()
  const { suggestedMatches, addMatch, setSuggestedMatches } = useMatchStore()
  const [actionLoading, setActionLoading] = useState(false)

  const profileUser = suggestedMatches.find(u => u.id === userId)

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">This user profile doesn't exist or is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const compatibilityScore = user?.personalityProfile && profileUser.personalityProfile
    ? calculateCompatibilityScore(user.personalityProfile, profileUser.personalityProfile)
    : 0

  const handleAcceptMatch = async () => {
    setActionLoading(true)
    try {
      const match = await matching.acceptMatch(profileUser.id)
      addMatch(match)
      setSuggestedMatches(suggestedMatches.filter(u => u.id !== profileUser.id))
    } catch (error) {
      console.error('Failed to accept match:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectMatch = async () => {
    setActionLoading(true)
    try {
      await matching.rejectMatch(profileUser.id)
      setSuggestedMatches(suggestedMatches.filter(u => u.id !== profileUser.id))
    } catch (error) {
      console.error('Failed to reject match:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const renderPersonalityChart = () => {
    if (!profileUser.personalityProfile) return null

    const traits = [
      { name: 'Openness', value: profileUser.personalityProfile.openness, color: 'bg-purple-500' },
      { name: 'Conscientiousness', value: profileUser.personalityProfile.conscientiousness, color: 'bg-blue-500' },
      { name: 'Extraversion', value: profileUser.personalityProfile.extraversion, color: 'bg-green-500' },
      { name: 'Agreeableness', value: profileUser.personalityProfile.agreeableness, color: 'bg-yellow-500' },
      { name: 'Neuroticism', value: profileUser.personalityProfile.neuroticism, color: 'bg-red-500' },
    ]

    return (
      <Card>
        <CardHeader>
          <CardTitle>Personality Profile</CardTitle>
          <CardDescription>Big Five personality traits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {traits.map((trait) => (
              <div key={trait.name}>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>{trait.name}</span>
                  <span>{trait.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${trait.color}`}
                    style={{ width: `${trait.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderLifestylePreferences = () => {
    if (!profileUser.personalityProfile) return null

    const { lifestylePreferences } = profileUser.personalityProfile

    return (
      <Card>
        <CardHeader>
          <CardTitle>Lifestyle Preferences</CardTitle>
          <CardDescription>Living preferences and habits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-sm">Cleanliness</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${lifestylePreferences.cleanliness}%` }}
                  />
                </div>
                <span className="text-sm">{lifestylePreferences.cleanliness}%</span>
              </div>
            </div>

            <div>
              <p className="font-medium text-sm">Social Level</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${lifestylePreferences.socialLevel}%` }}
                  />
                </div>
                <span className="text-sm">{lifestylePreferences.socialLevel}%</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-sm">Quiet Hours</span>
              <span className="text-sm font-medium">
                {lifestylePreferences.quietHours ? '✓ Yes' : '✗ No'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm">Pets</span>
              <span className="text-sm font-medium">
                {lifestylePreferences.pets ? '✓ Yes' : '✗ No'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm">Smoking</span>
              <span className="text-sm font-medium">
                {lifestylePreferences.smoking ? '✓ Yes' : '✗ No'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm">Communication</span>
              <span className="text-sm font-medium capitalize">
                {profileUser.personalityProfile.communicationStyle}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {profileUser.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profileUser.username}</h1>
              <p className="text-gray-600 capitalize">{profileUser.role}</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(profileUser.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-4xl font-bold ${
              compatibilityScore >= 80 ? 'text-green-600' :
              compatibilityScore >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {compatibilityScore}%
            </div>
            <div className="text-gray-500">compatible</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {renderPersonalityChart()}
          {renderLifestylePreferences()}

          {/* Compatibility Analysis */}
          {user?.personalityProfile && profileUser.personalityProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Compatibility Analysis</CardTitle>
                <CardDescription>How well you might get along as roommates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Similar cleanliness standards</li>
                      <li>• Compatible communication styles</li>
                      <li>• Aligned social preferences</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Things to Discuss</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Guest policies and overnight visitors</li>
                      <li>• Household chores and responsibilities</li>
                      <li>• Noise levels and quiet hours</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Take Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleAcceptMatch}
                disabled={actionLoading}
                className="w-full"
                size="lg"
              >
                {actionLoading ? 'Processing...' : '❤️ Like This Match'}
              </Button>
              <Button
                variant="outline"
                onClick={handleRejectMatch}
                disabled={actionLoading}
                className="w-full"
              >
                👎 Not Interested
              </Button>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Profile Status:</span>
                  <span className={`text-sm font-medium ${
                    profileUser.verificationStatus === 'verified' ? 'text-green-600' :
                    profileUser.verificationStatus === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {profileUser.verificationStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Assessment:</span>
                  <span className="text-sm font-medium text-green-600">
                    {profileUser.personalityProfile ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Tips */}
          <Card>
            <CardHeader>
              <CardTitle>💡 Safety First</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Meet in public places first</li>
                <li>• Video chat before meeting</li>
                <li>• Trust your instincts</li>
                <li>• Verify identity and references</li>
                <li>• Report any suspicious behavior</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}