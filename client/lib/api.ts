import axios from 'axios'
import Cookies from 'js-cookie'
import { User, PersonalityProfile, Match, Message, OnboardingProgress } from './utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Real API functions using Django backend
export const auth = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/login/', { email, password })
    const { user, access } = response.data
    Cookies.set('auth-token', access, { expires: 1, secure: false, sameSite: 'lax' })
    return { user, token: access }
  },

  register: async (userData: any): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/register/', {
      ...userData,
      password_confirm: userData.password
    })
    const { user, tokens } = response.data
    Cookies.set('auth-token', tokens.access, { expires: 1, secure: false, sameSite: 'lax' })
    return { user, token: tokens.access }
  },

  logout: async (): Promise<void> => {
    Cookies.remove('auth-token')
    try {
      await api.post('/auth/logout/')
    } catch (error) {
      // Ignore logout errors
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile/')
    return response.data
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.patch('/auth/profile/', userData)
    return response.data
  },

  getPublicProfile: async (userId: string): Promise<User> => {
    const response = await api.get(`/auth/users/${userId}/`)
    return response.data
  },

  // Onboarding progress functions
  getOnboardingProgress: async (): Promise<OnboardingProgress> => {
    const response = await api.get('/auth/onboarding/progress/')
    return response.data
  },

  updateOnboardingProgress: async (step: string): Promise<OnboardingProgress> => {
    const response = await api.post('/auth/onboarding/progress/update/', { step })
    return response.data
  },

  recalculateOnboardingProgress: async (): Promise<OnboardingProgress> => {
    const response = await api.post('/auth/onboarding/progress/recalculate/')
    return response.data
  }
}

export const personality = {
  getAssessment: async (): Promise<{ questions: any[] }> => {
    const response = await api.get('/personality/assessment/')
    return { questions: response.data }
  },

  submitAssessment: async (assessmentData: any): Promise<PersonalityProfile> => {
    const response = await api.post('/personality/submit/', assessmentData)
    return response.data.profile
  }
}

export const matching = {
  getSuggestions: async (): Promise<User[]> => {
    const response = await api.get('/matching/suggestions/')
    return response.data
  },

  getMatches: async (): Promise<Match[]> => {
    const response = await api.get('/matching/matches/')
    // Normalize camelCase to snake_case for consistency
    return response.data.map((match: any) => ({
      ...match,
      other_user: match.otherUser || match.other_user,
      compatibility_score: match.compatibilityScore || match.compatibility_score,
      is_primary: match.isPrimary || match.is_primary,
      living_space_id: match.livingSpaceId || match.living_space_id,
      created_at: match.createdAt || match.created_at
    }))
  },

  getMatchRequests: async (): Promise<any[]> => {
    const response = await api.get('/matching/requests/')
    return response.data
  },

  acceptMatch: async (userId: string): Promise<Match> => {
    const response = await api.post('/matching/accept/', { user_id: userId })
    return response.data
  },

  rejectMatch: async (userId: string): Promise<void> => {
    await api.post('/matching/reject/', { user_id: userId })
  },

  respondToMatchRequest: async (userId: string, response: 'accept' | 'decline'): Promise<any> => {
    const result = await api.post('/matching/respond/', { user_id: userId, response })
    return result.data
  },

  requestMatch: async (userId: string): Promise<any> => {
    const response = await api.post('/matching/request/', { user_id: userId })
    return response.data
  },

  unmatch: async (matchId: number): Promise<any> => {
    const response = await api.delete(`/matching/${matchId}/unmatch/`)
    return response.data
  }
}

export const messaging = {
  getMessages: async (matchId: string): Promise<Message[]> => {
    const response = await api.get(`/messaging/${matchId}/`)
    return response.data.messages || []
  },

  sendMessage: async (matchId: string, content: string): Promise<Message> => {
    const response = await api.post('/messaging/send/', { match_id: matchId, content })
    return response.data
  }
}

export const coliving = {
  getLivingSpaces: async (): Promise<any[]> => {
    const response = await api.get('/coliving/living-spaces/')
    return response.data.results || response.data
  },

  createLivingSpace: async (spaceData: any): Promise<any> => {
    const response = await api.post('/coliving/living-spaces/', spaceData)
    return response.data
  },

  updateLivingSpace: async (id: string, spaceData: any): Promise<any> => {
    const response = await api.put(`/coliving/living-spaces/${id}/`, spaceData)
    return response.data
  },

  getLivingSpace: async (id: string): Promise<any> => {
    const response = await api.get(`/coliving/living-spaces/${id}/`)
    return response.data
  },

  getRooms: async (): Promise<any[]> => {
    const response = await api.get('/coliving/rooms/')
    return response.data.results || response.data
  },

  createRoom: async (roomData: any): Promise<any> => {
    const response = await api.post('/coliving/rooms/', roomData)
    return response.data
  },

  applyForRoom: async (roomId: string, applicationData: any): Promise<any> => {
    const response = await api.post(`/coliving/rooms/${roomId}/apply/`, applicationData)
    return response.data
  },

  joinSpace: async (spaceId: string): Promise<any> => {
    const response = await api.post(`/coliving/living-spaces/${spaceId}/join/`)
    return response.data
  },

  getDashboard: async (): Promise<any> => {
    const response = await api.get('/coliving/dashboard/')
    return response.data
  },

  searchSpaces: async (params: any): Promise<any> => {
    const response = await api.get('/coliving/search/', { params })
    return response.data
  },

  uploadImage: async (spaceId: string, imageData: FormData): Promise<any> => {
    const response = await api.post('/coliving/images/', imageData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  deleteImage: async (imageId: string): Promise<void> => {
    await api.delete(`/coliving/images/${imageId}/`)
  },

  updateImage: async (imageId: string, data: any): Promise<any> => {
    const response = await api.put(`/coliving/images/${imageId}/`, data)
    return response.data
  },

  bookRoom: async (roomId: string, bookingData: any): Promise<any> => {
    const response = await api.post(`/coliving/rooms/${roomId}/book/`, bookingData)
    return response.data
  },

  requestSpaceMatch: async (spaceId: string, targetUserId: string): Promise<any> => {
    const response = await api.post(`/coliving/living-spaces/${spaceId}/request-match/`, { target_user_id: targetUserId })
    return response.data
  }
}

// Shared Dashboard API
export const sharedDashboard = {
  // Match Management
  setPrimaryMatch: async (matchId: number, isPrimary: boolean): Promise<any> => {
    const response = await api.post(`/matching/${matchId}/set-primary/`, { is_primary: isPrimary })
    return response.data
  },

  getDashboardInfo: async (matchId: number): Promise<any> => {
    const response = await api.get(`/matching/${matchId}/dashboard-info/`)
    return response.data
  },

  // Shared Dashboard Data
  getSharedDashboard: async (livingSpaceId: number): Promise<any> => {
    const response = await api.get(`/coliving/shared-dashboard/${livingSpaceId}/`)
    return response.data
  },

  // Shopping Lists
  createShoppingList: async (livingSpaceId: number, name: string): Promise<any> => {
    const response = await api.post(`/coliving/${livingSpaceId}/shopping-lists/create/`, { name })
    return response.data
  },

  addShoppingItem: async (listId: number, item: { name: string; quantity?: string; category?: string }): Promise<any> => {
    const response = await api.post(`/coliving/shopping-lists/${listId}/add-item/`, item)
    return response.data
  },

  toggleShoppingItem: async (itemId: number): Promise<any> => {
    const response = await api.patch(`/coliving/shopping-items/${itemId}/toggle/`, {})
    return response.data
  },

  // Bills
  createBill: async (livingSpaceId: number, bill: any): Promise<any> => {
    const response = await api.post(`/coliving/${livingSpaceId}/bills/create/`, bill)
    return response.data
  },

  updateBill: async (billId: number, bill: any): Promise<any> => {
    const response = await api.patch(`/coliving/bills/${billId}/`, bill)
    return response.data
  },

  deleteBill: async (billId: number): Promise<any> => {
    const response = await api.delete(`/coliving/bills/${billId}/`)
    return response.data
  },

  markBillPaid: async (billId: number): Promise<any> => {
    const response = await api.patch(`/coliving/bills/${billId}/mark-paid/`, {})
    return response.data
  },

  // Calendar Events
  createCalendarEvent: async (livingSpaceId: number, event: any): Promise<any> => {
    const response = await api.post(`/coliving/${livingSpaceId}/calendar-events/create/`, event)
    return response.data
  },

  // Notifications
  getNotifications: async (): Promise<any> => {
    const response = await api.get('/coliving/notifications/')
    return response.data
  },

  markNotificationRead: async (notificationId: number): Promise<any> => {
    const response = await api.patch(`/coliving/notifications/${notificationId}/mark-read/`, {})
    return response.data
  },

  // Tasks (using existing coliving endpoints)
  getTasks: async (livingSpaceId: number): Promise<any> => {
    const response = await api.get('/coliving/tasks/', { params: { living_space: livingSpaceId } })
    return response.data
  },

  createTask: async (task: any): Promise<any> => {
    const response = await api.post('/coliving/tasks/', task)
    return response.data
  },

  updateTask: async (taskId: number, task: any): Promise<any> => {
    const response = await api.patch(`/coliving/tasks/${taskId}/`, task)
    return response.data
  },

  // Expenses (using existing coliving endpoints)
  getExpenses: async (livingSpaceId: number): Promise<any> => {
    const response = await api.get('/coliving/expenses/', { params: { living_space: livingSpaceId } })
    return response.data
  },

  createExpense: async (expense: any): Promise<any> => {
    const response = await api.post('/coliving/expenses/', expense)
    return response.data
  },

  updateExpense: async (expenseId: number, expense: any): Promise<any> => {
    const response = await api.patch(`/coliving/expenses/${expenseId}/`, expense)
    return response.data
  },

  deleteExpense: async (livingSpaceId: number, expenseId: number): Promise<any> => {
    const response = await api.delete(`/coliving/expenses/${expenseId}/`)
    return response.data
  },

  settleExpenseSplit: async (expenseId: number, userId: number, isSettled: boolean): Promise<any> => {
    const response = await api.patch(`/coliving/expenses/${expenseId}/settle/${userId}/`, { is_settled: isSettled })
    return response.data
  },

  settleBillSplit: async (billId: number, userId: number, isSettled: boolean): Promise<any> => {
    const response = await api.patch(`/coliving/bills/${billId}/settle/${userId}/`, { is_settled: isSettled })
    return response.data
  },

  // House Rules
  createHouseRules: async (livingSpaceId: number, rules: any): Promise<any> => {
    const response = await api.post(`/coliving/${livingSpaceId}/house-rules/create/`, rules)
    return response.data
  },

  updateHouseRules: async (livingSpaceId: number, rulesId: number, rules: any): Promise<any> => {
    const response = await api.patch(`/coliving/${livingSpaceId}/house-rules/${rulesId}/update/`, rules)
    return response.data
  },

  // Living Spaces
  getMyLivingSpaces: async (): Promise<any> => {
    // Only get spaces where user is actually a member (for collaboration)
    const response = await api.get('/coliving/living-spaces/', {
      params: { my_spaces_only: 'true' }
    })
    return response.data
  },

  // Members and Invitations
  getMembers: async (livingSpaceId: number): Promise<any> => {
    const response = await api.get(`/coliving/${livingSpaceId}/members/`)
    return response.data
  },

  inviteMember: async (livingSpaceId: number, invitedUserId: number, role: string, message?: string): Promise<any> => {
    const response = await api.post(`/coliving/${livingSpaceId}/invite/`, {
      invited_user_id: invitedUserId,
      role,
      message
    })
    return response.data
  },

  getMyInvitations: async (): Promise<any> => {
    const response = await api.get('/coliving/invitations/')
    return response.data
  },

  respondToInvitation: async (invitationId: number, response: 'accept' | 'decline'): Promise<any> => {
    const result = await api.post(`/coliving/invitations/${invitationId}/respond/`, { response })
    return result.data
  },

  removeMember: async (livingSpaceId: number, memberId: number): Promise<any> => {
    const response = await api.delete(`/coliving/${livingSpaceId}/members/${memberId}/remove/`)
    return response.data
  },

  deleteLivingSpace: async (livingSpaceId: number): Promise<any> => {
    const response = await api.delete(`/coliving/living-spaces/${livingSpaceId}/`)
    return response.data
  },
}