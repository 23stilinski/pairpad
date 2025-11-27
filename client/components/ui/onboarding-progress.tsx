'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/api'
import { useOnboardingStore } from '@/lib/store'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import type { OnboardingProgress } from '@/lib/utils'

interface OnboardingProgressProps {
  compact?: boolean
  showDetails?: boolean
}

export function OnboardingProgressWidget({ compact = false, showDetails = true }: OnboardingProgressProps) {
  const { onboardingProgress, setOnboardingProgress } = useOnboardingStore()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true)
      try {
        const progress = await auth.getOnboardingProgress()
        setOnboardingProgress(progress)
      } catch (error) {
        console.error('Failed to fetch onboarding progress:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgress()
  }, [setOnboardingProgress])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-[#5d41ab]" />
      </div>
    )
  }

  if (!onboardingProgress) {
    return null
  }

  if (compact) {
    return <CompactProgressView progress={onboardingProgress} />
  }

  return <DetailedProgressView progress={onboardingProgress} showDetails={showDetails} />
}

function CompactProgressView({ progress }: { progress: OnboardingProgress }) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-400'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Onboarding Progress</h3>
        <span className="text-xs text-gray-500">
          {progress.completedStepsCount} / {progress.totalSteps} steps
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress.overallProgress)}`}
          style={{ width: `${progress.overallProgress}%` }}
        />
      </div>

      <p className="text-xs text-gray-600">
        {progress.statusDisplay} - {progress.overallProgress}% complete
      </p>
    </div>
  )
}

function DetailedProgressView({ progress, showDetails }: { progress: OnboardingProgress; showDetails: boolean }) {
  const steps = [
    {
      id: 'account_created',
      title: 'Create Account',
      completed: progress.accountCreated,
      description: 'Set up your PairPad account'
    },
    {
      id: 'personal_info_completed',
      title: 'Personal Information',
      completed: progress.personalInfoCompleted,
      description: 'Tell us about yourself'
    },
    {
      id: 'location_preferences_completed',
      title: 'Location & Budget',
      completed: progress.locationPreferencesCompleted,
      description: 'Where do you want to live?'
    },
    {
      id: 'lifestyle_preferences_completed',
      title: 'Lifestyle Preferences',
      completed: progress.lifestylePreferencesCompleted,
      description: 'Share your living preferences'
    },
    {
      id: 'assessment_started',
      title: 'Start Assessment',
      completed: progress.assessmentStarted,
      description: 'Begin personality assessment'
    },
    {
      id: 'assessment_completed',
      title: 'Complete Assessment',
      completed: progress.assessmentCompleted,
      description: 'Finish personality assessment'
    }
  ]

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-500'
    if (percentage >= 75) return 'text-blue-500'
    if (percentage >= 50) return 'text-yellow-500'
    return 'text-red-400'
  }

  const getBgColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-400'
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-800">Your Onboarding Progress</h2>
          <span className={`text-3xl font-bold ${getProgressColor(progress.overallProgress)}`}>
            {progress.overallProgress}%
          </span>
        </div>

        {/* Main progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getBgColor(progress.overallProgress)}`}
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{progress.statusDisplay}</span>
          <span>
            {progress.completedStepsCount} of {progress.totalSteps} steps completed
          </span>
        </div>
      </div>

      {/* Detailed breakdown */}
      {showDetails && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-900">Registration</h3>
                <span className="text-lg font-bold text-blue-600">{progress.registrationProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress.registrationProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-purple-900">Assessment</h3>
                <span className="text-lg font-bold text-purple-600">{progress.assessmentProgress}%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress.assessmentProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Step list */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Steps</h3>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                  step.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${step.completed ? 'text-green-900' : 'text-gray-700'}`}>
                    {index + 1}. {step.title}
                  </h4>
                  <p className={`text-sm ${step.completed ? 'text-green-700' : 'text-gray-500'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Next step suggestion */}
          {!progress.isComplete && progress.nextStep && (
            <div className="mt-6 bg-[#5d41ab] bg-opacity-10 border border-[#5d41ab] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[#5d41ab] mb-2">Next Step</h3>
              <p className="text-[#484848] font-medium mb-3">{progress.nextStep.title}</p>
              <a
                href={progress.nextStep.url}
                className="inline-block px-4 py-2 bg-[#5d41ab] text-white rounded-lg font-medium hover:bg-[#4c2d87] transition-colors"
              >
                Continue Onboarding
              </a>
            </div>
          )}

          {/* Completion message */}
          {progress.isComplete && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-green-900 mb-1">Onboarding Complete!</h3>
              <p className="text-green-700">
                You're all set! Start exploring matches and finding your perfect roommate.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
