'use client'

interface ScoreBreakdownProps {
  compatibilityScore: number
  similarityScore?: number
  breakdown?: {
    lifestyle: number
    basic_lifestyle: number
    personality: number
    communication: number
    location: number
  }
  compact?: boolean
}

export function ScoreBreakdown({
  compatibilityScore,
  similarityScore,
  breakdown,
  compact = false
}: ScoreBreakdownProps) {

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-500'
  }

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-400'
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Compatibility</span>
            <span className={`text-lg font-bold ${getScoreColor(compatibilityScore)}`}>
              {compatibilityScore}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getBarColor(compatibilityScore)}`}
              style={{ width: `${compatibilityScore}%` }}
            />
          </div>
        </div>

        {similarityScore !== undefined && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Similarity</span>
              <span className={`text-lg font-bold ${getScoreColor(similarityScore)}`}>
                {similarityScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getBarColor(similarityScore)}`}
                style={{ width: `${similarityScore}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-[#484848] mb-6">Match Analysis</h3>

      {/* Main Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#5d41ab] to-[#7c5fbb] rounded-xl p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Compatibility Score</p>
          <p className="text-4xl font-bold">{compatibilityScore}%</p>
          <p className="text-xs opacity-75 mt-2">How well you'd live together</p>
        </div>

        {similarityScore !== undefined && (
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Similarity Score</p>
            <p className="text-4xl font-bold">{similarityScore}%</p>
            <p className="text-xs opacity-75 mt-2">How alike you are</p>
          </div>
        )}
      </div>

      {/* Detailed Breakdown */}
      {breakdown && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 mb-3">Score Breakdown</h4>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏠</span>
                <span className="text-sm font-medium text-gray-700">Lifestyle</span>
              </div>
              <span className={`text-lg font-bold ${getScoreColor(breakdown.lifestyle)}`}>
                {breakdown.lifestyle}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getBarColor(breakdown.lifestyle)}`}
                style={{ width: `${breakdown.lifestyle}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Daily routines, habits, and preferences</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="text-sm font-medium text-gray-700">Living Habits</span>
              </div>
              <span className={`text-lg font-bold ${getScoreColor(breakdown.basic_lifestyle)}`}>
                {breakdown.basic_lifestyle}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getBarColor(breakdown.basic_lifestyle)}`}
                style={{ width: `${breakdown.basic_lifestyle}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Cleanliness, social level, quiet hours</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                <span className="text-sm font-medium text-gray-700">Personality</span>
              </div>
              <span className={`text-lg font-bold ${getScoreColor(breakdown.personality)}`}>
                {breakdown.personality}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getBarColor(breakdown.personality)}`}
                style={{ width: `${breakdown.personality}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Big Five personality traits</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <span className="text-sm font-medium text-gray-700">Communication</span>
              </div>
              <span className={`text-lg font-bold ${getScoreColor(breakdown.communication)}`}>
                {breakdown.communication}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getBarColor(breakdown.communication)}`}
                style={{ width: `${breakdown.communication}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Communication style compatibility</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <span className="text-sm font-medium text-gray-700">Location</span>
              </div>
              <span className={`text-lg font-bold ${getScoreColor(breakdown.location)}`}>
                {breakdown.location}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getBarColor(breakdown.location)}`}
                style={{ width: `${breakdown.location}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Preferred city and location match</p>
          </div>
        </div>
      )}

      {/* Interpretation */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-700">
          {compatibilityScore >= 80 && (
            <span>🎉 <strong>Excellent match!</strong> You both have very compatible lifestyles and personalities.</span>
          )}
          {compatibilityScore >= 60 && compatibilityScore < 80 && (
            <span>✨ <strong>Good match!</strong> You share many compatible preferences and could live well together.</span>
          )}
          {compatibilityScore >= 40 && compatibilityScore < 60 && (
            <span>💡 <strong>Moderate match.</strong> You have some differences but could work well with communication.</span>
          )}
          {compatibilityScore < 40 && (
            <span>🤔 <strong>Different lifestyles.</strong> You may need extra effort to accommodate each other's preferences.</span>
          )}
        </p>
      </div>
    </div>
  )
}
