'use client'

import { useState } from 'react'
import { sharedDashboard } from '@/lib/api'
import toast from 'react-hot-toast'

interface Notification {
  id: number
  notification_type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

interface NotificationsPanelProps {
  notifications: Notification[]
  onRefresh: () => void
}

export default function NotificationsPanel({ notifications, onRefresh }: NotificationsPanelProps) {
  const [dismissing, setDismissing] = useState<number | null>(null)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return '📋'
      case 'task_completed': return '✅'
      case 'task_due_soon': return '⏰'
      case 'expense_added': return '💰'
      case 'expense_settled': return '✔️'
      case 'bill_due_soon': return '📄'
      case 'shopping_item_added': return '🛒'
      default: return '📬'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned': return 'bg-blue-50 border-blue-200'
      case 'task_completed': return 'bg-green-50 border-green-200'
      case 'task_due_soon': return 'bg-orange-50 border-orange-200'
      case 'expense_added': return 'bg-purple-50 border-purple-200'
      case 'bill_due_soon': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const handleDismiss = async (notificationId: number) => {
    try {
      setDismissing(notificationId)
      await sharedDashboard.markNotificationRead(notificationId)
      onRefresh()
    } catch (error) {
      console.error('Failed to dismiss notification:', error)
      toast.error('Failed to dismiss notification')
    } finally {
      setDismissing(null)
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getNotificationColor(notification.notification_type)} border-2 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md`}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getNotificationIcon(notification.notification_type)}</div>
            <div className="flex-1">
              <h4 className="font-bold text-[#484848] mb-1">{notification.title}</h4>
              <p className="text-sm text-[#484848]">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(notification.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(notification.id)}
              disabled={dismissing === notification.id}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              {dismissing === notification.id ? '...' : '✕'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
