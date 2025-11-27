'use client'

import { useState, useEffect } from 'react'
import { usePersonalityStore, useAuthStore, useOnboardingStore } from '@/lib/store'
import { personality, auth as authApi } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

// Icons
const BrainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.5 2C8.25 2 7.25 3 7.25 4.25c0 .41.11.8.3 1.15-.7.27-1.2.94-1.2 1.73 0 .5.2.95.51 1.28C6.34 8.7 6 9.33 6 10.05c0 .53.2 1.01.52 1.38-.32.37-.52.85-.52 1.38 0 1.1.9 2 2 2h.09c.17.53.53.96 1 1.22-.1.24-.15.5-.15.77 0 1.1.9 2 2 2s2-.9 2-2c0-.27-.05-.53-.15-.77.47-.26.83-.69 1-1.22H14c1.1 0 2-.9 2-2 0-.53-.2-1.01-.52-1.38.32-.37.52-.85.52-1.38 0-.72-.34-1.35-.86-1.74.31-.33.51-.78.51-1.28 0-.79-.5-1.46-1.2-1.73.19-.35.3-.74.3-1.15C14.75 3 13.75 2 12.5 2c-.69 0-1.3.31-1.71.79C10.38 2.31 9.94 2 9.5 2z" fill="currentColor"/>
  </svg>
)

const assessmentSections = [
  {
    id: 'lifestyle',
    title: 'Lifestyle & Daily Routine',
    icon: '🌅',
    questions: [
      {
        id: 'early_bird',
        question: 'Are you an early bird or a night owl?',
        type: 'choice',
        options: [
          { value: 'early_bird', label: 'Early Bird (wake up before 7 AM)' },
          { value: 'balanced', label: 'Balanced (wake up 7-9 AM)' },
          { value: 'night_owl', label: 'Night Owl (wake up after 9 AM)' },
        ]
      },
      {
        id: 'cooking_frequency',
        question: 'How often do you cook at home?',
        type: 'choice',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'few_times_week', label: 'A few times a week' },
          { value: 'rarely', label: 'Rarely' },
          { value: 'never', label: 'Never (eat out/order)' },
        ]
      },
      {
        id: 'hosting_visitors',
        question: 'How often do you host visitors?',
        type: 'choice',
        options: [
          { value: 'frequently', label: 'Frequently (weekly)' },
          { value: 'occasionally', label: 'Occasionally (monthly)' },
          { value: 'rarely', label: 'Rarely (few times a year)' },
          { value: 'never', label: 'Never' },
        ]
      },
      {
        id: 'smoking_drinking',
        question: 'Do you smoke / drink alcohol?',
        type: 'choice',
        options: [
          { value: 'both', label: 'Yes, both' },
          { value: 'drink_only', label: 'Only drink' },
          { value: 'smoke_only', label: 'Only smoke' },
          { value: 'neither', label: 'Neither' },
        ]
      },
      {
        id: 'noise_preference',
        question: 'Do you prefer quiet spaces or don\'t mind noise?',
        type: 'choice',
        options: [
          { value: 'very_quiet', label: 'Need very quiet environment' },
          { value: 'moderate', label: 'Moderate noise is fine' },
          { value: 'dont_mind', label: 'Don\'t mind noise' },
        ]
      },
    ]
  },
  {
    id: 'cleanliness',
    title: 'Cleanliness & Household Habits',
    icon: '✨',
    questions: [
      {
        id: 'tidiness_level',
        question: 'How tidy do you usually keep your room/common spaces?',
        type: 'choice',
        options: [
          { value: 'very_messy', label: 'Very messy - Things pile up quickly' },
          { value: 'somewhat_messy', label: 'Somewhat messy - Organized chaos' },
          { value: 'moderately_tidy', label: 'Moderately tidy - Clean most of the time' },
          { value: 'very_tidy', label: 'Very tidy - Everything has its place' },
        ]
      },
      {
        id: 'chore_frequency',
        question: 'How often do you do chores?',
        type: 'choice',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'as_needed', label: 'As needed' },
          { value: 'rarely', label: 'Rarely' },
        ]
      },
      {
        id: 'sharing_items',
        question: 'Do you mind sharing household items (utensils, cleaning supplies)?',
        type: 'choice',
        options: [
          { value: 'happy_to_share', label: 'Happy to share everything' },
          { value: 'some_items', label: 'Okay with sharing some items' },
          { value: 'prefer_separate', label: 'Prefer to keep items separate' },
        ]
      },
    ]
  },
  {
    id: 'financial',
    title: 'Financial & Cost-Sharing',
    icon: '💰',
    questions: [
      {
        id: 'bill_splitting',
        question: 'How would you prefer to split bills?',
        type: 'choice',
        options: [
          { value: 'equally', label: 'Equally (50/50)' },
          { value: 'by_usage', label: 'By usage' },
          { value: 'flexible', label: 'Flexible/negotiable' },
        ]
      },
      {
        id: 'cost_sharing',
        question: 'Apart from rent and internet, are you open to cost-sharing groceries/cleaning items?',
        type: 'choice',
        options: [
          { value: 'yes_all', label: 'Yes, share all groceries/items' },
          { value: 'some_items', label: 'Only some items' },
          { value: 'no_separate', label: 'No, prefer separate' },
        ]
      },
      {
        id: 'bill_payment',
        question: 'How strict are you about paying bills on time?',
        type: 'choice',
        options: [
          { value: 'very_strict', label: 'Very strict (always on time)' },
          { value: 'usually_on_time', label: 'Usually on time' },
          { value: 'flexible', label: 'Flexible (few days late is okay)' },
        ]
      },
    ]
  },
  {
    id: 'social',
    title: 'Social Compatibility',
    icon: '🤝',
    questions: [
      {
        id: 'roommate_relationship',
        question: 'Do you prefer roommates who are mostly friends or just co-tenants?',
        type: 'choice',
        options: [
          { value: 'close_friends', label: 'Close friends' },
          { value: 'friendly', label: 'Friendly but not best friends' },
          { value: 'cotenants', label: 'Just co-tenants (minimal interaction)' },
        ]
      },
      {
        id: 'group_activities',
        question: 'Do you enjoy group activities with roommates (meals, outings)?',
        type: 'choice',
        options: [
          { value: 'love_it', label: 'Love it! (frequently)' },
          { value: 'occasionally', label: 'Occasionally' },
          { value: 'rarely', label: 'Rarely' },
          { value: 'prefer_not', label: 'Prefer not to' },
        ]
      },
      {
        id: 'gender_preference',
        question: 'Are you comfortable living with roommates of any gender?',
        type: 'choice',
        options: [
          { value: 'any_gender', label: 'Yes, any gender is fine' },
          { value: 'same_gender', label: 'Prefer same gender only' },
          { value: 'specific', label: 'Have specific preferences' },
        ]
      },
    ]
  },
  {
    id: 'personal',
    title: 'Personal Preferences',
    icon: '🏡',
    questions: [
      {
        id: 'pets',
        question: 'Do you have pets / are you okay living with pets?',
        type: 'choice',
        options: [
          { value: 'have_pets', label: 'I have pets' },
          { value: 'love_pets', label: 'Love pets, don\'t have any' },
          { value: 'okay_with_pets', label: 'Okay with pets' },
          { value: 'no_pets', label: 'No pets please' },
          { value: 'allergic', label: 'Allergic to pets' },
        ]
      },
      {
        id: 'allergies',
        question: 'Do you have any allergies that could affect shared living?',
        type: 'choice',
        options: [
          { value: 'none', label: 'No allergies' },
          { value: 'dust', label: 'Dust' },
          { value: 'pets', label: 'Pets' },
          { value: 'food', label: 'Food allergies' },
          { value: 'multiple', label: 'Multiple allergies' },
        ]
      },
      {
        id: 'ideal_personality',
        question: 'What\'s your ideal roommate personality?',
        type: 'choice',
        options: [
          { value: 'quiet_respectful', label: 'Quiet and respectful' },
          { value: 'social_outgoing', label: 'Social and outgoing' },
          { value: 'independent', label: 'Independent (does their own thing)' },
          { value: 'collaborative', label: 'Collaborative (shares responsibilities)' },
        ]
      },
    ]
  },
  {
    id: 'personality',
    title: 'Quick Personality Traits',
    icon: '🧠',
    questions: [
      {
        id: 'social_energy',
        question: 'I feel energized by social interactions',
        type: 'agreement',
      },
      {
        id: 'organization',
        question: 'I am highly organized and plan ahead',
        type: 'agreement',
      },
      {
        id: 'conflict_style',
        question: 'I prefer to address conflicts directly and immediately',
        type: 'agreement',
      },
      {
        id: 'flexibility',
        question: 'I am flexible and adapt easily to changes',
        type: 'agreement',
      },
    ]
  },
]

export default function PersonalityAssessment() {
  const [currentSection, setCurrentSection] = useState(0)
  const [responses, setResponses] = useState<{ [key: string]: any }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { updateAssessment, completeAssessment } = usePersonalityStore()
  const { updateUser, checkAuth } = useAuthStore()
  const { setOnboardingProgress } = useOnboardingStore()

  const currentSectionData = assessmentSections[currentSection]
  const isLastSection = currentSection === assessmentSections.length - 1

  const handleResponse = (questionId: string, value: any) => {
    setResponses({ ...responses, [questionId]: value })
  }

  const isCurrentSectionComplete = () => {
    return currentSectionData.questions.every(q => responses[q.id] !== undefined)
  }

  const handleNext = () => {
    if (isCurrentSectionComplete()) {
      setCurrentSection(prev => Math.min(prev + 1, assessmentSections.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentSection(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    if (!isCurrentSectionComplete()) return

    setIsSubmitting(true)

    try {
      // Calculate personality scores based on responses
      const personalityScores = {
        openness: responses.flexibility ? (responses.flexibility * 20) : 50,
        conscientiousness: responses.organization ? (responses.organization * 20) : 50,
        extraversion: responses.social_energy ? (responses.social_energy * 20) : 50,
        agreeableness: responses.conflict_style ? ((6 - responses.conflict_style) * 20) : 50,
        neuroticism: 50, // Default
      }

      const submissionData = {
        // Personality traits
        ...personalityScores,

        // Lifestyle preferences
        cleanliness_level: responses.tidiness_level || 50,
        social_level: responses.social_energy ? (responses.social_energy * 20) : 50,
        quiet_hours: responses.noise_preference === 'very_quiet',
        pets_allowed: ['have_pets', 'love_pets', 'okay_with_pets'].includes(responses.pets),
        smoking_allowed: ['both', 'smoke_only'].includes(responses.smoking_drinking),

        // Communication style (derived from conflict_style)
        communication_style: responses.conflict_style >= 4 ? 'direct' :
                            responses.conflict_style >= 3 ? 'casual' : 'diplomatic',

        // Store all lifestyle responses as JSON in a custom field if needed
        lifestyle_data: responses,
      }

      const result = await personality.submitAssessment(submissionData)
      updateAssessment(result)
      completeAssessment()
      updateUser({ personalityProfile: result })

      // Update onboarding progress
      try {
        const progress = await authApi.updateOnboardingProgress('assessment_completed')
        setOnboardingProgress(progress)
      } catch (error) {
        console.error('Failed to update onboarding progress:', error)
      }

      // Refresh user data
      await checkAuth()

      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Failed to submit assessment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: any) => {
    switch (question.type) {
      case 'choice':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option: any, index: number) => {
              const optionLetter = ['A', 'B', 'C', 'D', 'E', 'F'][index]
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleResponse(question.id, option.value)}
                  className={`text-left px-6 py-4 rounded-xl border-2 transition-all ${
                    responses[question.id] === option.value
                      ? 'border-[#5d41ab] bg-[#5d41ab] bg-opacity-10 text-[#5d41ab] font-semibold'
                      : 'border-gray-200 bg-white hover:border-[#5d41ab] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                      responses[question.id] === option.value
                        ? 'bg-[#5d41ab] text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {optionLetter}
                    </div>
                    <div className="flex-1">
                      <span className={`block font-medium ${
                        responses[question.id] === option.value
                          ? 'text-[#5d41ab]'
                          : 'text-gray-800'
                      }`}>{option.label}</span>
                    </div>
                    {responses[question.id] === option.value && (
                      <Check className="w-5 h-5 text-[#5d41ab] flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )

      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{question.labels[question.min]}</span>
              <span>{question.labels[question.max]}</span>
            </div>
            <input
              type="range"
              min={question.min}
              max={question.max}
              value={responses[question.id] || 50}
              onChange={(e) => handleResponse(question.id, parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#5d41ab]"
            />
            <div className="text-center">
              <span className="text-2xl font-bold text-[#5d41ab]">{responses[question.id] || 50}%</span>
            </div>
          </div>
        )

      case 'agreement':
        return (
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleResponse(question.id, value)}
                className={`w-14 h-14 rounded-xl font-bold text-lg transition-all ${
                  responses[question.id] === value
                    ? 'bg-gradient-to-br from-[#5d41ab] to-[#4c2d87] text-white shadow-lg scale-110'
                    : 'bg-white border-2 border-gray-200 text-[#484848] hover:border-[#5d41ab] hover:scale-105'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 font-['DynaPuff',Helvetica,Arial,sans-serif]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-[#5d41ab] hover:text-[#4c2d87] mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="w-20 h-20 bg-gradient-to-br from-[#5d41ab] to-[#4c2d87] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BrainIcon />
          </div>
          <h1 className="text-4xl font-bold text-[#484848] mb-3">Roommate Compatibility Assessment</h1>
          <p className="text-[#9ca299] text-lg">Help us find your perfect roommate match</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Section {currentSection + 1} of {assessmentSections.length}
            </span>
            <span className="text-sm font-medium text-[#5d41ab]">
              {Math.round(((currentSection + 1) / assessmentSections.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-[#5d41ab] to-[#7c5fbb] h-3 rounded-full transition-all duration-500"
              style={{ width: `${((currentSection + 1) / assessmentSections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Section Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl">{currentSectionData.icon}</span>
            <h2 className="text-2xl font-bold text-[#484848]">{currentSectionData.title}</h2>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentSectionData.questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#5d41ab] to-[#4c2d87] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <h3 className="text-lg font-medium text-[#484848] flex-1">
                  {question.question}
                </h3>
              </div>
              {renderQuestion(question)}
              {question.type === 'agreement' && (
                <div className="flex justify-between text-xs text-gray-500 mt-3 px-2">
                  <span>Strongly Disagree</span>
                  <span>Neutral</span>
                  <span>Strongly Agree</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentSection === 0}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {!isLastSection ? (
            <button
              onClick={handleNext}
              disabled={!isCurrentSectionComplete()}
              className="px-8 py-3 bg-gradient-to-r from-[#5d41ab] to-[#7c5fbb] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Section
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isCurrentSectionComplete() || isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-[#5d41ab] to-[#7c5fbb] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Complete Assessment
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
