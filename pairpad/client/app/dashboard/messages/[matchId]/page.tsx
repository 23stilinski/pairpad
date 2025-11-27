'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMessageStore, useMatchStore } from '@/lib/store'
import { messaging, matching } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function ChatPage() {
  const params = useParams()
  const matchId = params.matchId as string

  const { messages, setMessages, addMessage } = useMessageStore()
  const { matches, setMatches } = useMatchStore()
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentMatch = matches.find(match => match.id === matchId)
  const currentMessages = messages[matchId] || []

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load matches if not loaded
        if (matches.length === 0) {
          const matchesData = await matching.getMatches()
          setMatches(matchesData)
        }

        // Load messages
        const chatMessages = await messaging.getMessages(matchId)
        setMessages(matchId, chatMessages)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [matchId, setMessages, setMatches, matches.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const message = await messaging.sendMessage(matchId, newMessage.trim())
      addMessage(matchId, message)
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!currentMatch) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Conversation Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">This conversation doesn't exist or you don't have access to it.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const otherUser = currentMatch.otherUser
  const otherUserName = otherUser?.username || otherUser?.first_name || 'Unknown User'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {otherUserName[0]}
                </span>
              </div>
              <div>
                <h2 className="font-medium">{otherUserName}</h2>
                <p className="text-sm text-green-600">
                  {currentMatch.compatibilityScore}% compatible
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            currentMessages.map((message) => {
              const isOwn = message.senderId === '1'

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>

      {/* Safety Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">💡 Safety Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Meet in public places for initial meetings</li>
            <li>• Trust your instincts and report any inappropriate behavior</li>
            <li>• Take time to get to know potential roommates before committing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}