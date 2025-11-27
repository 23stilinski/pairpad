'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useMatchStore, useMessageStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { matching } from '@/lib/api'

export default function MessagesPage() {
  const { matches, setMatches } = useMatchStore()
  const { messages } = useMessageStore()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const matchesData = await matching.getMatches()
        setMatches(matchesData)
      } catch (error) {
        console.error('Failed to load matches:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [setMatches])

  useEffect(() => {
    // Create conversation list from matches with last message info
    const convos = matches.map(match => {
      const matchMessages = messages[match.id] || []
      const lastMessage = matchMessages[matchMessages.length - 1]
      const unreadCount = matchMessages.filter(msg => !msg.readStatus && msg.receiverId === '1').length

      return {
        match,
        lastMessage,
        unreadCount,
        lastActivity: lastMessage?.timestamp || match.createdAt
      }
    }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())

    setConversations(convos)
  }, [matches, messages])

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#484848] mb-4">
              Messages
            </h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5d41ab] mx-auto mt-8"></div>
            <p className="mt-4 text-gray-600">Loading your conversations...</p>
          </div>
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#484848] mb-4">
              Messages
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start conversations with your matched roommates.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-[#5d41ab]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#5d41ab]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#484848] mb-4">
                No Conversations Yet
              </h2>
              <p className="text-gray-600 mb-8">
                You haven't matched with anyone yet. Find compatible roommates to start messaging.
              </p>
              <Link href="/dashboard/matches">
                <button className="bg-[#5d41ab] text-white px-8 py-3 rounded-full font-medium hover:bg-[#4c2d87] transition-colors">
                  Find Matches
                </button>
              </Link>
            </div>
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
            Messages
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your conversations with matched roommates.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {conversations.map(({ match, lastMessage, unreadCount, lastActivity }) => {
            // Get the other user from the match data
            const otherUser = match.otherUser
            const otherUserName = otherUser?.username || otherUser?.first_name || 'Unknown User'
            const otherUserInitial = otherUserName.charAt(0).toUpperCase()

            return (
              <Link key={match.id} href={`/dashboard/messages/${match.id}`}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-[#5d41ab]/10 rounded-full flex items-center justify-center">
                        <span className="text-[#5d41ab] font-bold text-lg">
                          {otherUserInitial}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-[#484848] text-lg">
                            {otherUserName}
                          </h3>
                          <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                            {match.compatibilityScore}% compatible
                          </span>
                          {unreadCount > 0 && (
                            <span className="bg-[#5d41ab] text-white text-xs px-2 py-1 rounded-full font-medium">
                              {unreadCount}
                            </span>
                          )}
                        </div>

                        {lastMessage ? (
                          <div>
                            <p className="text-gray-600 text-sm truncate mb-1">
                              {lastMessage.senderId === '1' ? 'You: ' : ''}
                              {lastMessage.content}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {formatDate(lastMessage.timestamp)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            New match • Start a conversation
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-gray-400 group-hover:text-[#5d41ab] transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}