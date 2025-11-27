'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { sharedDashboard } from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'

// Import components
import TasksSection from '@/components/shared-dashboard/TasksSection'
import ExpensesSection from '@/components/shared-dashboard/ExpensesSection'
import BillsSection from '@/components/shared-dashboard/BillsSection'
import ShoppingListSection from '@/components/shared-dashboard/ShoppingListSection'
import CalendarSection from '@/components/shared-dashboard/CalendarSection'
import HouseRulesSection from '@/components/shared-dashboard/HouseRulesSection'
import NotificationsPanel from '@/components/shared-dashboard/NotificationsPanel'
import MembersSection from '@/components/shared-dashboard/MembersSection'

export default function SharedDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, checkAuth } = useAuthStore()
  const matchId = params.matchId as string
  const spaceIdParam = searchParams.get('spaceId')

  const [dashboardData, setDashboardData] = useState<any>(null)
  const [matchInfo, setMatchInfo] = useState<any>(null)
  const [livingSpaceId, setLivingSpaceId] = useState<number | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadDashboard()
    }
  }, [matchId, spaceIdParam, user])

  const loadDashboard = async () => {
    try {
      setLoading(true)

      // If spaceId is provided in query params, use it directly
      if (spaceIdParam) {
        const spaceId = Number(spaceIdParam)
        setLivingSpaceId(spaceId)

        // Get full dashboard data
        const dashboard = await sharedDashboard.getSharedDashboard(spaceId)
        setDashboardData(dashboard)

        // Get members
        const membersData = await sharedDashboard.getMembers(spaceId)
        setMembers(membersData)
      } else {
        // Original flow: Get match info and living space
        const matchResponse = await sharedDashboard.getDashboardInfo(Number(matchId))
        setMatchInfo(matchResponse)
        setLivingSpaceId(matchResponse.living_space_id)

        // Get full dashboard data
        const dashboard = await sharedDashboard.getSharedDashboard(matchResponse.living_space_id)
        setDashboardData(dashboard)

        // Get members
        const membersData = await sharedDashboard.getMembers(matchResponse.living_space_id)
        setMembers(membersData)
      }
    } catch (error: any) {
      console.error('Failed to load dashboard:', error)
      toast.error('Failed to load shared dashboard')
      router.push('/dashboard/matches')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSpace = async () => {
    if (!confirm('Are you sure you want to delete this living space? This will permanently delete all tasks, expenses, bills, and other data. This action cannot be undone.')) {
      return
    }

    try {
      await sharedDashboard.deleteLivingSpace(livingSpaceId!)
      toast.success('Living space deleted successfully')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Failed to delete living space:', error)
      toast.error(error.response?.data?.error || 'Failed to delete living space')
    }
  }

  // Check if current user is admin
  const currentMember = members.find(m => m.user === user?.id)
  const isAdmin = currentMember?.role === 'admin'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['DynaPuff',Helvetica,Arial,sans-serif]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5d41ab] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#484848] font-medium">Loading shared dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['DynaPuff',Helvetica,Arial,sans-serif]">
        <div className="text-center">
          <p className="text-[#484848] text-xl mb-4">Dashboard not found</p>
          <button
            onClick={() => router.push('/dashboard/matches')}
            className="bg-[#5d41ab] text-white px-6 py-3 rounded-2xl"
          >
            Back to Matches
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['DynaPuff',Helvetica,Arial,sans-serif]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5d41ab] to-[#4c2d87] text-white py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {dashboardData.living_space.name}
              </h1>
              {matchInfo ? (
                <p className="text-red-100">
                  Living with {matchInfo.other_user.fullName || matchInfo.other_user.username}
                </p>
              ) : (
                <p className="text-red-100">
                  Shared Living Space • {members.length} {members.length === 1 ? 'member' : 'members'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {matchInfo && (
                <div className="text-right">
                  <div className="text-4xl font-bold mb-1">{matchInfo.compatibility_score}%</div>
                  <div className="text-sm text-red-100">Compatible</div>
                  {matchInfo.is_primary && (
                    <div className="mt-2 bg-white/20 px-3 py-1 rounded-full text-xs">
                      ⭐ Primary Match
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={handleDeleteSpace}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-xl transition-colors border border-red-400/30"
                  title="Delete Living Space"
                >
                  🗑️ Delete Space
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Notifications */}
        {dashboardData.notifications && dashboardData.notifications.length > 0 && (
          <NotificationsPanel
            notifications={dashboardData.notifications}
            onRefresh={loadDashboard}
          />
        )}

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <TasksSection
              tasks={dashboardData.tasks}
              livingSpaceId={livingSpaceId!}
              otherUser={matchInfo?.other_user || null}
              onUpdate={loadDashboard}
            />

            <ExpensesSection
              expenses={dashboardData.expenses}
              livingSpaceId={livingSpaceId!}
              otherUser={matchInfo?.other_user || null}
              onUpdate={loadDashboard}
              members={members}
            />

            <CalendarSection
              events={dashboardData.calendar_events}
              livingSpaceId={livingSpaceId!}
              onUpdate={loadDashboard}
            />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            <MembersSection
              livingSpaceId={livingSpaceId!}
              members={members}
              currentUserId={user?.id!}
              onUpdate={loadDashboard}
            />

            <BillsSection
              bills={dashboardData.bills}
              livingSpaceId={livingSpaceId!}
              onUpdate={loadDashboard}
            />

            <ShoppingListSection
              lists={dashboardData.shopping_lists}
              livingSpaceId={livingSpaceId!}
              onUpdate={loadDashboard}
            />

            <HouseRulesSection
              houseRules={dashboardData.house_rules}
              livingSpaceId={livingSpaceId!}
              onUpdate={loadDashboard}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
