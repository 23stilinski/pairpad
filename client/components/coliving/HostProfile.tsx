'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'

interface User {
  id: string
  username: string
  first_name?: string
  last_name?: string
  fullName?: string
  bio?: string
  interests?: string
  personalityProfile?: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
    lifestylePreferences: {
      cleanliness: number
      socialLevel: number
      quietHours: boolean
      pets: boolean
      smoking: boolean
    }
    communicationStyle: string
  }
  cleanliness_level?: number
  social_level?: number
}

interface HostProfileProps {
  host: User | string
}

export default function HostProfile({ host }: HostProfileProps) {
  // Handle both string and object host data
  const hostData = typeof host === 'string' ? null : host
  const hostName = hostData?.fullName || hostData?.username || (typeof host === 'string' ? host : 'Host')
  const hostInitial = hostName.charAt(0).toUpperCase()
  const personalityProfile = hostData?.personalityProfile

  // Convert interests string to array
  const interests = hostData?.interests ? hostData.interests.split(',').map(i => i.trim()).filter(Boolean) : []

  // Render star rating
  const renderStars = (value: number, total: number = 100) => {
    const stars = Math.round((value / total) * 5)
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= stars ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-[#484848]">About the Host</CardTitle>
        <CardDescription className="text-gray-700">Personality traits and living preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#5d41ab]/10 rounded-full flex items-center justify-center">
              <span className="text-[#5d41ab] font-bold text-lg">
                {hostInitial}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-[#484848] text-base">
                {hostName}
              </h4>
              <p className="text-sm text-gray-700">Space Owner</p>
            </div>
          </div>

          {hostData?.bio && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-800 text-sm">{hostData.bio}</p>
            </div>
          )}

          {/* Personality traits */}
          {personalityProfile && (
            <div>
              <h5 className="font-medium text-[#484848] mb-3">Personality Traits</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                  <span className="text-sm font-medium text-gray-800">Cleanliness</span>
                  {renderStars(personalityProfile.lifestylePreferences?.cleanliness || hostData?.cleanliness_level || 50)}
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                  <span className="text-sm font-medium text-gray-800">Social</span>
                  {renderStars(personalityProfile.lifestylePreferences?.socialLevel || hostData?.social_level || 50)}
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border">
                  <span className="text-sm font-medium text-gray-800">Extraversion</span>
                  {renderStars(personalityProfile.extraversion)}
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border">
                  <span className="text-sm font-medium text-gray-800">Organized</span>
                  {renderStars(personalityProfile.conscientiousness)}
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border">
                  <span className="text-sm font-medium text-gray-800">Openness</span>
                  {renderStars(personalityProfile.openness)}
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border">
                  <span className="text-sm font-medium text-gray-800">Agreeable</span>
                  {renderStars(personalityProfile.agreeableness)}
                </div>
              </div>
            </div>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <div>
              <h5 className="font-medium text-[#484848] mb-3">Interests</h5>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <span key={index} className="px-3 py-1 bg-[#5d41ab]/10 text-[#5d41ab] rounded-full text-sm font-medium">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fallback when no personality or interests data */}
          {!personalityProfile && interests.length === 0 && (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-700 text-sm">
                Host profile information will be displayed once available.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}