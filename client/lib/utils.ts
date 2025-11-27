import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
}

export function calculateCompatibilityScore(
  user1Personality: PersonalityProfile,
  user2Personality: PersonalityProfile
): number {
  // Big Five traits compatibility scoring
  const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']

  let totalScore = 0
  traits.forEach(trait => {
    const diff = Math.abs(user1Personality[trait] - user2Personality[trait])
    // Convert difference to compatibility score (closer = higher score)
    const traitScore = Math.max(0, 100 - (diff * 20))
    totalScore += traitScore
  })

  return Math.round(totalScore / traits.length)
}

export interface PersonalityProfile {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  lifestylePreferences: {
    cleanliness: number
    socialLevel: number
    quietHours: boolean
    pets: boolean
    smoking: boolean
  }
  communicationStyle: 'direct' | 'diplomatic' | 'casual' | 'formal'
}

export interface User {
  id: string
  email: string
  username: string
  role: 'student' | 'professional' | 'admin' | 'coordinator'
  personalityProfile?: PersonalityProfile
  verificationStatus: 'pending' | 'verified' | 'rejected'
  createdAt: string
  updatedAt: string

  // Personal Information
  first_name?: string
  last_name?: string
  fullName?: string
  date_of_birth?: string
  age?: number
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
  phone_number?: string

  // Professional Information
  occupation?: string
  education?: string

  // Location & Housing Preferences
  current_city?: string
  preferred_city?: string
  budget_min?: number
  budget_max?: number
  move_in_date?: string
  lease_duration?: '3_months' | '6_months' | '12_months' | '18_months' | '24_months' | 'flexible'

  // Lifestyle Preferences
  smoking_preference?: 'no_preference' | 'smoker' | 'non_smoker'
  pets_preference?: 'no_preference' | 'has_pets' | 'no_pets' | 'loves_pets'
  guests_preference?: 'rarely' | 'occasionally' | 'frequently' | 'no_guests'
  cleanliness_level?: number
  social_level?: number
  quiet_hours?: boolean

  // Profile Information
  bio?: string
  interests?: string

  // Matching scores (added by matching algorithm)
  compatibility_score?: number
  similarity_score?: number
  score_breakdown?: {
    lifestyle: number
    basic_lifestyle: number
    personality: number
    communication: number
    location: number
  }
}

export interface Match {
  id: string
  user1Id: string
  user2Id: string
  compatibilityScore: number
  similarity_score?: number
  score_breakdown?: {
    lifestyle: number
    basic_lifestyle: number
    personality: number
    communication: number
    location: number
  }
  status: 'pending' | 'accepted' | 'rejected' | 'mutual'
  createdAt: string
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  readStatus: boolean
  matchId: string
}

export interface OnboardingProgress {
  id: string
  user: User
  status: 'not_started' | 'in_progress' | 'completed'
  statusDisplay: string

  // Progress percentages
  overallProgress: number
  registrationProgress: number
  assessmentProgress: number

  // Step tracking
  completedStepsCount: number
  totalSteps: number
  currentStep: string | null
  nextStep: {
    step: string
    title: string
    url: string
  }

  // Breakdown (new field)
  breakdown?: {
    registration: number
    assessment: number
    total_steps: number
    completed_steps: number
  }

  // Profile completeness
  profileCompletenessScore: number
  isComplete: boolean

  // Individual step statuses (backward compatible)
  accountCreated: boolean
  personalInfoCompleted: boolean
  locationPreferencesCompleted: boolean
  lifestylePreferencesCompleted: boolean
  assessmentStarted: boolean
  assessmentCompleted: boolean

  // Timestamps (updated field names)
  createdAt: string
  updatedAt: string
  completedAt?: string | null
}