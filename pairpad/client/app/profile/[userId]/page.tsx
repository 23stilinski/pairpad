'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { auth, matching } from '@/lib/api'
import { User } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import {
  ArrowLeft, MapPin, Calendar, Briefcase, GraduationCap,
  Home, DollarSign, Users, Cigarette, Dog, MessageCircle,
  CheckCircle, XCircle, Clock
} from 'lucide-react'
import { ScoreBreakdown } from '@/components/ui/score-breakdown'
import toast from 'react-hot-toast'
import { Heart, X } from 'lucide-react'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const { user: currentUser } = useAuthStore()

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [matchStatus, setMatchStatus] = useState<'none' | 'liked' | 'matched'>('none')

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await auth.getPublicProfile(userId)
      setProfileUser(data)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLikeUser = async () => {
    if (!currentUser || !profileUser) return

    setActionLoading(true)
    try {
      const match = await matching.acceptMatch(profileUser.id)

      if (match.status === 'mutual') {
        setMatchStatus('matched')
        toast.success(`🎉 It's a match with ${profileUser.username}! You can now start chatting.`)
      } else {
        setMatchStatus('liked')
        toast.success(`❤️ You liked ${profileUser.username}!`)
      }
    } catch (error: any) {
      console.error('Failed to like user:', error)
      const errorMessage = error.response?.data?.error || 'Failed to like this user'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePassUser = async () => {
    if (!currentUser || !profileUser) return

    setActionLoading(true)
    try {
      await matching.rejectMatch(profileUser.id)
      toast.success(`👎 Passed on ${profileUser.username}`)
      router.push('/dashboard/matches')
    } catch (error: any) {
      console.error('Failed to pass user:', error)
      const errorMessage = error.response?.data?.error || 'Failed to pass on this user'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const getAge = () => {
    if (!profileUser?.date_of_birth) return null
    return profileUser.age
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getVerificationBadge = () => {
    if (!profileUser) return null

    const statusConfig = {
      verified: { color: 'text-green-600 bg-green-50', icon: CheckCircle, text: 'Verified' },
      pending: { color: 'text-yellow-600 bg-yellow-50', icon: Clock, text: 'Pending' },
      rejected: { color: 'text-red-600 bg-red-50', icon: XCircle, text: 'Not Verified' }
    }

    const config = statusConfig[profileUser.verificationStatus]
    const Icon = config.icon

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 mb-4">{error || 'This profile does not exist.'}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#5d41ab] to-[#7c5cbf] rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-[#5d41ab]">
                {profileUser.username[0].toUpperCase()}
              </span>
            </div>

            {/* User Info */}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {profileUser.fullName || profileUser.username}
              </h1>
              <p className="text-lg opacity-90 capitalize mb-2">{profileUser.role}</p>
              <div className="flex items-center space-x-4 text-sm opacity-80">
                {getAge() && (
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {getAge()} years old
                  </span>
                )}
                {profileUser.current_city && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profileUser.current_city}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          <div>{getVerificationBadge()}</div>
        </div>
      </div>

      {/* Match Action Buttons - Only show if viewing someone else's profile */}
      {currentUser && currentUser.id !== profileUser.id && (
        <div className="mb-8">
          {matchStatus === 'matched' ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">It's a Match!</h3>
                  <p className="text-green-700 mb-4">
                    You and {profileUser.username} have matched! You can now start chatting.
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard/messages')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : matchStatus === 'liked' ? (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">❤️</div>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">You Liked This Profile!</h3>
                  <p className="text-blue-700">
                    If {profileUser.username} likes you back, you'll be notified and can start chatting.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleLikeUser}
                    disabled={actionLoading}
                    size="lg"
                    className="bg-[#5d41ab] hover:bg-[#4c2d87] text-white px-8"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    {actionLoading ? 'Processing...' : 'Like'}
                  </Button>
                  <Button
                    onClick={handlePassUser}
                    disabled={actionLoading}
                    size="lg"
                    variant="outline"
                    className="border-gray-300 text-gray-700 px-8"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Pass
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          {profileUser.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900 whitespace-pre-line">{profileUser.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Personality Profile */}
          {profileUser.personalityProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Personality Profile</CardTitle>
                <CardDescription>Big Five personality traits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Openness', value: profileUser.personalityProfile.openness, color: 'bg-purple-500' },
                    { name: 'Conscientiousness', value: profileUser.personalityProfile.conscientiousness, color: 'bg-blue-500' },
                    { name: 'Extraversion', value: profileUser.personalityProfile.extraversion, color: 'bg-green-500' },
                    { name: 'Agreeableness', value: profileUser.personalityProfile.agreeableness, color: 'bg-yellow-500' },
                    { name: 'Neuroticism', value: profileUser.personalityProfile.neuroticism, color: 'bg-red-500' },
                  ].map((trait) => (
                    <div key={trait.name}>
                      <div className="flex justify-between text-sm font-medium text-gray-900 mb-1">
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
          )}

          {/* Lifestyle Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Lifestyle Preferences</CardTitle>
              <CardDescription>Living habits and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Smoking */}
                <div className="flex items-center space-x-3">
                  <Cigarette className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="text-sm text-gray-800">Smoking</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {profileUser.smoking_preference?.replace('_', ' ') || 'No preference'}
                    </p>
                  </div>
                </div>

                {/* Pets */}
                <div className="flex items-center space-x-3">
                  <Dog className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="text-sm text-gray-800">Pets</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {profileUser.pets_preference?.replace('_', ' ') || 'No preference'}
                    </p>
                  </div>
                </div>

                {/* Guests */}
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="text-sm text-gray-800">Guests</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {profileUser.guests_preference || 'No preference'}
                    </p>
                  </div>
                </div>

                {/* Cleanliness */}
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-gray-700">✨</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Cleanliness</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${profileUser.cleanliness_level || 50}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{profileUser.cleanliness_level || 50}%</span>
                    </div>
                  </div>
                </div>

                {/* Social Level */}
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-gray-700" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Social Level</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${profileUser.social_level || 50}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{profileUser.social_level || 50}%</span>
                    </div>
                  </div>
                </div>

                {/* Quiet Hours */}
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-gray-700">🌙</div>
                  <div>
                    <p className="text-sm text-gray-800">Quiet Hours</p>
                    <p className="font-medium text-gray-900">
                      {profileUser.quiet_hours ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compatibility Scores */}
          {profileUser.compatibility_score !== undefined && profileUser.similarity_score !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Compatibility Analysis</CardTitle>
                <CardDescription>How well you match with this person</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {profileUser.compatibility_score}%
                    </div>
                    <div className="text-sm text-gray-900">Compatibility</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {profileUser.similarity_score}%
                    </div>
                    <div className="text-sm text-gray-900">Similarity</div>
                  </div>
                </div>
                {profileUser.score_breakdown && (
                  <ScoreBreakdown breakdown={profileUser.score_breakdown} mode="full" />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Professional Info */}
          {(profileUser.occupation || profileUser.education) && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profileUser.occupation && (
                  <div className="flex items-center space-x-3">
                    <Briefcase className="w-5 h-5 text-gray-700" />
                    <div>
                      <p className="text-sm text-gray-800">Occupation</p>
                      <p className="font-medium text-gray-900">{profileUser.occupation}</p>
                    </div>
                  </div>
                )}
                {profileUser.education && (
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="w-5 h-5 text-gray-700" />
                    <div>
                      <p className="text-sm text-gray-800">Education</p>
                      <p className="font-medium text-gray-900">{profileUser.education}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Housing Preferences */}
          {(profileUser.preferred_city || profileUser.budget_min || profileUser.move_in_date) && (
            <Card>
              <CardHeader>
                <CardTitle>Housing Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profileUser.preferred_city && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-700" />
                    <div>
                      <p className="text-sm text-gray-800">Preferred City</p>
                      <p className="font-medium text-gray-900">{profileUser.preferred_city}</p>
                    </div>
                  </div>
                )}
                {(profileUser.budget_min || profileUser.budget_max) && (
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-700" />
                    <div>
                      <p className="text-sm text-gray-800">Budget</p>
                      <p className="font-medium text-gray-900">
                        ${profileUser.budget_min || 0} - ${profileUser.budget_max || 0}/month
                      </p>
                    </div>
                  </div>
                )}
                {profileUser.move_in_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-700" />
                    <div>
                      <p className="text-sm text-gray-800">Move-in Date</p>
                      <p className="font-medium text-gray-900">{formatDate(profileUser.move_in_date)}</p>
                    </div>
                  </div>
                )}
                {profileUser.lease_duration && (
                  <div className="flex items-center space-x-3">
                    <Home className="w-5 h-5 text-gray-700" />
                    <div>
                      <p className="text-sm text-gray-800">Lease Duration</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {profileUser.lease_duration.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Interests */}
          {profileUser.interests && (
            <Card>
              <CardHeader>
                <CardTitle>Interests & Hobbies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900 whitespace-pre-line">{profileUser.interests}</p>
              </CardContent>
            </Card>
          )}

          {/* Member Since */}
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-700" />
                <div>
                  <p className="text-sm text-gray-800">Member Since</p>
                  <p className="font-medium text-gray-900">{formatDate(profileUser.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  )
}
