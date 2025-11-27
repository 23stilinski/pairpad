'use client'

import { useState } from 'react'
import { sharedDashboard } from '@/lib/api'
import toast from 'react-hot-toast'

interface CalendarEvent {
  id: number
  title: string
  description: string
  event_type: string
  start_datetime: string
  end_datetime: string | null
  all_day: boolean
  created_by: string
}

interface CalendarSectionProps {
  events: CalendarEvent[]
  livingSpaceId: number
  onUpdate: () => void
}

export default function CalendarSection({ events, livingSpaceId, onUpdate }: CalendarSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'other',
    start_datetime: '',
    end_datetime: '',
    all_day: false,
  })
  const [loading, setLoading] = useState(false)

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await sharedDashboard.createCalendarEvent(livingSpaceId, newEvent)
      toast.success('Event created!')
      setShowAddModal(false)
      setNewEvent({
        title: '',
        description: '',
        event_type: 'other',
        start_datetime: '',
        end_datetime: '',
        all_day: false,
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to create event:', error)
      toast.error('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return '🧹'
      case 'maintenance': return '🔧'
      case 'guests': return '👥'
      case 'bill_due': return '📄'
      case 'lease': return '📝'
      default: return '📅'
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'cleaning': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-orange-100 text-orange-800'
      case 'guests': return 'bg-purple-100 text-purple-800'
      case 'bill_due': return 'bg-red-100 text-red-800'
      case 'lease': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatEventTime = (startDate: string, endDate: string | null, allDay: boolean) => {
    const start = new Date(startDate)
    if (allDay) {
      return start.toLocaleDateString()
    }
    const timeStr = start.toLocaleString()
    if (endDate) {
      const end = new Date(endDate)
      return `${start.toLocaleString()} - ${end.toLocaleTimeString()}`
    }
    return timeStr
  }

  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  )

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#484848]">Calendar</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#5d41ab] text-white px-4 py-2 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105"
        >
          + Add Event
        </button>
      </div>

      {/* Events List */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-500">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              className="border-2 border-gray-100 rounded-2xl p-4 hover:border-[#5d41ab] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getEventIcon(event.event_type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-[#484848]">{event.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getEventColor(event.event_type)} capitalize`}>
                      {event.event_type.replace('_', ' ')}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>⏰ {formatEventTime(event.start_datetime, event.end_datetime, event.all_day)}</span>
                    <span>👤 {event.created_by}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-[#484848] mb-6">Add Calendar Event</h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="e.g., House Cleaning Day"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Event Type</label>
                <select
                  value={newEvent.event_type}
                  onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                >
                  <option value="other">Other</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="guests">Guests</option>
                  <option value="bill_due">Bill Due</option>
                  <option value="lease">Lease</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Start Date/Time</label>
                <input
                  type="datetime-local"
                  value={newEvent.start_datetime}
                  onChange={(e) => setNewEvent({ ...newEvent, start_datetime: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">End Date/Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={newEvent.end_datetime}
                  onChange={(e) => setNewEvent({ ...newEvent, end_datetime: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEvent.all_day}
                    onChange={(e) => setNewEvent({ ...newEvent, all_day: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-gray-300"
                  />
                  <span className="text-sm font-medium text-[#484848]">All Day Event</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  rows={3}
                  placeholder="Optional details..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-[#484848] py-3 rounded-2xl font-medium hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
