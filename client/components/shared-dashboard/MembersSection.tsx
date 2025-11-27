'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { sharedDashboard, matching } from '@/lib/api'

interface Member {
  id: number
  user: number
  username: string
  full_name: string
  email: string
  role: string
  joined_at: string
  is_active: boolean
}

interface MembersSectionProps {
  livingSpaceId: number
  members: Member[]
  currentUserId: number
  onUpdate: () => void
}

export default function MembersSection({ livingSpaceId, members, currentUserId, onUpdate }: MembersSectionProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [inviteMessage, setInviteMessage] = useState('')
  const [matches, setMatches] = useState<any[]>([])

  const isAdmin = members.find(m => m.user === currentUserId)?.role === 'admin'

  const handleSearchUsers = async () => {
    try {
      setLoading(true)
      // Get user's matches to invite
      const userMatches = await matching.getMatches()

      // Filter out users who are already members
      const memberUserIds = members.map(m => m.user)
      const availableMatches = userMatches.filter((match: any) =>
        !memberUserIds.includes(match.other_user.id)
      )

      setMatches(availableMatches)
    } catch (error) {
      console.error('Failed to search users:', error)
      toast.error('Failed to search users')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to invite')
      return
    }

    try {
      setLoading(true)
      await sharedDashboard.inviteMember(livingSpaceId, selectedUser.other_user.id, 'member', inviteMessage)
      toast.success('Invitation sent successfully!')
      setShowInviteModal(false)
      setSelectedUser(null)
      setInviteMessage('')
      setSearchQuery('')
      onUpdate()
    } catch (error: any) {
      console.error('Failed to send invitation:', error)
      toast.error(error.response?.data?.error || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: number, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} from this living space?`)) {
      return
    }

    try {
      await sharedDashboard.removeMember(livingSpaceId, memberId)
      toast.success('Member removed successfully')
      onUpdate()
    } catch (error: any) {
      console.error('Failed to remove member:', error)
      toast.error(error.response?.data?.error || 'Failed to remove member')
    }
  }

  const handleLeaveSpace = async () => {
    if (!confirm('Are you sure you want to leave this living space?')) {
      return
    }

    try {
      const currentMember = members.find(m => m.user === currentUserId)
      if (!currentMember) {
        toast.error('Could not find your membership')
        return
      }

      await sharedDashboard.removeMember(livingSpaceId, currentMember.id)
      toast.success('You have left the living space')
      // Redirect to dashboard after leaving
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Failed to leave space:', error)
      toast.error(error.response?.data?.error || 'Failed to leave space')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'member': return 'bg-blue-100 text-blue-800'
      case 'guest': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#484848]">👥 Members ({members.length})</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                setShowInviteModal(true)
                handleSearchUsers()
              }}
              className="px-4 py-2 bg-[#5d41ab] text-white rounded-xl hover:bg-[#4c2d87] transition-colors"
            >
              + Invite Member
            </button>
          )}
          {!isAdmin && (
            <button
              onClick={handleLeaveSpace}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
            >
              Leave Space
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#5d41ab] rounded-full flex items-center justify-center text-white text-xl font-bold">
                {member.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[#484848]">{member.full_name || member.username}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(member.role)} capitalize`}>
                    {member.role}
                  </span>
                  {member.user === currentUserId && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">You</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
              </div>
            </div>

            {isAdmin && member.user !== currentUserId && member.role !== 'admin' && (
              <button
                onClick={() => handleRemoveMember(member.id, member.username)}
                className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors text-sm"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-[#484848] mb-4">Invite Member</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Select from your matches</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {matches.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No available matches to invite</p>
                  ) : (
                    matches.map((match) => (
                      <button
                        key={match.id}
                        onClick={() => setSelectedUser(match)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                          selectedUser?.id === match.id
                            ? 'border-[#5d41ab] bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#5d41ab] rounded-full flex items-center justify-center text-white font-bold">
                            {match.other_user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[#484848]">{match.other_user.fullName || match.other_user.username}</div>
                            <div className="text-sm text-gray-500">{Math.round(match.compatibility_score)}% compatible</div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Message (optional)</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848] resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-2xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={loading || !selectedUser}
                  className="flex-1 px-4 py-3 bg-[#5d41ab] text-white rounded-2xl font-medium hover:bg-[#4c2d87] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
