'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sharedDashboard, matching } from '@/lib/api'
import toast from 'react-hot-toast'

interface LivingSpace {
  id: number
  name: string
  address: string
  description: string
  member_count: number
  role: string
}

interface MatchInfo {
  id: number
  living_space_id: number
}

export default function MySpacesSection() {
  const router = useRouter()
  const [spaces, setSpaces] = useState<LivingSpace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSpaces()
  }, [])

  const loadSpaces = async () => {
    try {
      setLoading(true)
      const data = await sharedDashboard.getMyLivingSpaces()
      console.log('Living spaces response:', data)

      // Handle paginated response from DRF
      const spacesArray = Array.isArray(data) ? data : (data.results || [])
      console.log('Number of spaces:', spacesArray.length)
      setSpaces(spacesArray)
    } catch (error: any) {
      console.error('Failed to load living spaces:', error)
      console.error('Error response:', error.response?.data)
      toast.error('Failed to load your living spaces')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSpace = (spaceId: number) => {
    // Navigate to shared dashboard using spaceId query parameter
    // Using a dummy matchId (0) since the page will use spaceId instead
    router.push(`/dashboard/shared/0?spaceId=${spaceId}`)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#5d41ab] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (spaces.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
        <h2 className="text-2xl font-bold text-[#484848] mb-4">🏠 My Living Spaces</h2>
        <p className="text-gray-600">
          You're not a member of any living spaces yet. Accept an invitation or create a shared dashboard with a match!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
      <h2 className="text-2xl font-bold text-[#484848] mb-6">🏠 My Living Spaces</h2>

      <div className="space-y-4">
        {spaces.map((space) => (
          <div
            key={space.id}
            className="border-2 border-gray-100 rounded-2xl p-5 hover:border-[#5d41ab] transition-all hover:shadow-md cursor-pointer"
            onClick={() => handleOpenSpace(space.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-[#484848]">{space.name}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    space.role === 'admin'
                      ? 'bg-[#5d41ab] text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {space.role}
                  </span>
                </div>

                {space.address && (
                  <p className="text-sm text-gray-600 mb-2">📍 {space.address}</p>
                )}

                {space.description && (
                  <p className="text-sm text-gray-700 mb-3">{space.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>👥 {space.member_count} {space.member_count === 1 ? 'member' : 'members'}</span>
                </div>
              </div>

              <div className="ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenSpace(space.id)
                  }}
                  className="bg-[#5d41ab] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105 text-sm"
                >
                  Open Dashboard
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
