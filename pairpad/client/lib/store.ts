import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { User, Match, Message, PersonalityProfile, OnboardingProgress } from './utils'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  checkAuth: () => void
  setLoading: (loading: boolean) => void
}

interface MatchState {
  matches: Match[]
  suggestedMatches: User[]
  setMatches: (matches: Match[]) => void
  setSuggestedMatches: (users: User[]) => void
  addMatch: (match: Match) => void
  updateMatchStatus: (matchId: string, status: Match['status']) => void
}

interface MessageState {
  messages: { [matchId: string]: Message[] }
  setMessages: (matchId: string, messages: Message[]) => void
  addMessage: (matchId: string, message: Message) => void
  markAsRead: (matchId: string, messageId: string) => void
}

interface PersonalityState {
  assessmentData: Partial<PersonalityProfile>
  isCompleted: boolean
  updateAssessment: (data: Partial<PersonalityProfile>) => void
  completeAssessment: () => void
  resetAssessment: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
      logout: () => {
        // Clear cookie token on logout
        Cookies.remove('auth-token')
        set({ user: null, isAuthenticated: false, isLoading: false })
      },
      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } })
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
      checkAuth: async () => {
        const token = Cookies.get('auth-token')
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false })
          return
        }

        try {
          // Import auth here to avoid circular dependency
          const { auth } = await import('./api')
          const user = await auth.getProfile()
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          // Token is invalid, clear it
          Cookies.remove('auth-token')
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  suggestedMatches: [],
  setMatches: (matches) => set({ matches }),
  setSuggestedMatches: (suggestedMatches) => set({ suggestedMatches }),
  addMatch: (match) => set((state) => ({ matches: [...state.matches, match] })),
  updateMatchStatus: (matchId, status) => set((state) => ({
    matches: state.matches.map(match =>
      match.id === matchId ? { ...match, status } : match
    )
  }))
}))

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},
  setMessages: (matchId, messages) => set((state) => ({
    messages: { ...state.messages, [matchId]: messages }
  })),
  addMessage: (matchId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [matchId]: [...(state.messages[matchId] || []), message]
    }
  })),
  markAsRead: (matchId, messageId) => set((state) => ({
    messages: {
      ...state.messages,
      [matchId]: state.messages[matchId]?.map(msg =>
        msg.id === messageId ? { ...msg, readStatus: true } : msg
      ) || []
    }
  }))
}))

export const usePersonalityStore = create<PersonalityState>((set) => ({
  assessmentData: {},
  isCompleted: false,
  updateAssessment: (data) => set((state) => ({
    assessmentData: { ...state.assessmentData, ...data }
  })),
  completeAssessment: () => set({ isCompleted: true }),
  resetAssessment: () => set({ assessmentData: {}, isCompleted: false })
}))

interface OnboardingState {
  onboardingProgress: OnboardingProgress | null
  isLoading: boolean
  setOnboardingProgress: (progress: OnboardingProgress) => void
  updateProgress: (step: string) => void
  clearProgress: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      onboardingProgress: null,
      isLoading: false,
      setOnboardingProgress: (progress) => set({ onboardingProgress: progress }),
      updateProgress: (step) => set((state) => {
        if (!state.onboardingProgress) return state
        // This will be updated via API call, just update local state temporarily
        return { onboardingProgress: { ...state.onboardingProgress, currentStep: step } }
      }),
      clearProgress: () => set({ onboardingProgress: null })
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({
        onboardingProgress: state.onboardingProgress
      })
    }
  )
)