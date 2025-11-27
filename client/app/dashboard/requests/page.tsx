'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { matching, sharedDashboard } from '@/lib/api'
import { Heart, X, MapPin, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface MatchRequest {
  id: string
  requestingUser: any
  compatibilityScore: number | {
    compatibility_score: number
    similarity_score: number
    breakdown: any
  }
  createdAt: string
}

interface Invitation {
  id: number
  living_space: number
  living_space_name: string
  invited_by: number
  invited_by_name: string
  status: string
  role: string
  message: string
  created_at: string
  expires_at: string
  is_expired: boolean
}

export default function MatchRequestsPage() {
  const [requests, setRequests] = useState<MatchRequest[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [respondingToInvitation, setRespondingToInvitation] = useState<number | null>(null)

  useEffect(() => {
    loadMatchRequests()
    loadInvitations()
  }, [])

  const getCompatibilityScore = (score: number | { compatibility_score: number; similarity_score: number; breakdown: any }): number => {
    if (typeof score === 'number') {
      return score
    }
    return score.compatibility_score || 0
  }

  const loadMatchRequests = async () => {
    try {
      const requestsData = await matching.getMatchRequests()
      setRequests(requestsData)
    } catch (error) {
      console.error('Failed to load match requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvitations = async () => {
    try {
      const data = await sharedDashboard.getMyInvitations()
      setInvitations(data)
    } catch (error) {
      console.error('Failed to load invitations:', error)
    }
  }

  const handleResponse = async (userId: string, response: 'accept' | 'decline') => {
    setRespondingTo(userId)
    try {
      await matching.respondToMatchRequest(userId, response)
      // Remove the request from the list
      setRequests(prev => prev.filter(req => req.requestingUser.id !== userId))

      if (response === 'accept') {
        // Show success message for match
        alert('Match created! You can now start messaging.')
      }
    } catch (error) {
      console.error('Failed to respond to match request:', error)
      alert('Failed to respond to match request')
    } finally {
      setRespondingTo(null)
    }
  }

  const handleInvitationResponse = async (invitationId: number, response: 'accept' | 'decline') => {
    setRespondingToInvitation(invitationId)
    try {
      await sharedDashboard.respondToInvitation(invitationId, response)

      if (response === 'accept') {
        toast.success('Invitation accepted! You can now access the shared dashboard.')
      } else {
        toast.success('Invitation declined')
      }

      loadInvitations()
    } catch (error: any) {
      console.error('Failed to respond to invitation:', error)
      toast.error(error.response?.data?.error || 'Failed to respond to invitation')
    } finally {
      setRespondingToInvitation(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#484848] mb-4">
              Match Requests
            </h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5d41ab] mx-auto mt-8"></div>
            <p className="mt-4 text-gray-600">Loading your match requests...</p>
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
            Requests & Invitations
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Match requests and living space invitations
          </p>
        </div>

        {/* Living Space Invitations */}
        {invitations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#484848] mb-6">🏠 Living Space Invitations</h2>
            <div className="grid gap-6">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className={`bg-white rounded-3xl shadow-xl p-6 border-2 ${
                    invitation.is_expired ? 'border-red-200 opacity-60' : 'border-[#5d41ab]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-[#484848]">{invitation.living_space_name}</h3>
                        {invitation.is_expired && (
                          <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-800">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">
                        <span className="font-medium">{invitation.invited_by_name}</span> invited you to join as{' '}
                        <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {invitation.role}
                        </span>
                      </p>

                      {invitation.message && (
                        <div className="p-3 bg-gray-50 rounded-xl mb-3">
                          <p className="text-sm text-[#484848] italic">"{invitation.message}"</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div>Invited: {new Date(invitation.created_at).toLocaleDateString()}</div>
                        <div>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  {!invitation.is_expired && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                        disabled={respondingToInvitation === invitation.id}
                        className="flex-1 bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all disabled:opacity-50"
                      >
                        {respondingToInvitation === invitation.id ? 'Accepting...' : '✓ Accept'}
                      </button>
                      <button
                        onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                        disabled={respondingToInvitation === invitation.id}
                        className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Requests */}
        <h2 className="text-2xl font-bold text-[#484848] mb-6">❤️ Match Requests</h2>
        {requests.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-[#5d41ab]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-[#5d41ab]" />
              </div>
              <h2 className="text-2xl font-bold text-[#484848] mb-4">
                No Match Requests
              </h2>
              <p className="text-gray-600 mb-8">
                No one has liked your profile yet. Make sure your profile is complete and engaging!
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {requests.map((request) => {
              const user = request.requestingUser
              const userInitial = user.username?.charAt(0).toUpperCase() || 'U'
              const isResponding = respondingTo === user.id

              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-[#5d41ab]/10 rounded-full flex items-center justify-center">
                          <span className="text-[#5d41ab] font-bold text-xl">
                            {userInitial}
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-[#484848] text-xl">
                              {user.username || user.first_name || 'Unknown User'}
                            </h3>
                            <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                              {Math.round(getCompatibilityScore(request.compatibilityScore))}% compatible
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {user.current_city && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{user.current_city}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Liked {formatDate(request.createdAt)}</span>
                            </div>
                          </div>

                          {user.bio && (
                            <p className="text-gray-700 text-sm mt-2 line-clamp-2">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleResponse(user.id, 'decline')}
                          variant="outline"
                          size="sm"
                          disabled={isResponding}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          onClick={() => handleResponse(user.id, 'accept')}
                          size="sm"
                          disabled={isResponding}
                          className="bg-[#5d41ab] hover:bg-[#4c2d87]"
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}