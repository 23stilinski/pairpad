'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { sharedDashboard } from '@/lib/api'

interface HouseRule {
  id: number
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  guests_allowed: boolean
  max_guests: number | null
  smoking_allowed: boolean
  pets_allowed: boolean
  custom_rules: string
  created_at: string
  updated_at: string
}

interface HouseRulesSectionProps {
  livingSpaceId: number
  houseRules: HouseRule | null
  onUpdate: () => void
}

export default function HouseRulesSection({ livingSpaceId, houseRules, onUpdate }: HouseRulesSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    quiet_hours_start: houseRules?.quiet_hours_start || '',
    quiet_hours_end: houseRules?.quiet_hours_end || '',
    guests_allowed: houseRules?.guests_allowed ?? true,
    max_guests: houseRules?.max_guests || 2,
    smoking_allowed: houseRules?.smoking_allowed ?? false,
    pets_allowed: houseRules?.pets_allowed ?? false,
    custom_rules: houseRules?.custom_rules || ''
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        quiet_hours_start: formData.quiet_hours_start || null,
        quiet_hours_end: formData.quiet_hours_end || null,
        max_guests: formData.guests_allowed ? formData.max_guests : null
      }

      if (houseRules?.id) {
        await sharedDashboard.updateHouseRules(livingSpaceId, houseRules.id, payload)
        toast.success('House rules updated successfully')
      } else {
        await sharedDashboard.createHouseRules(livingSpaceId, payload)
        toast.success('House rules created successfully')
      }

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Failed to save house rules:', error)
      toast.error('Failed to save house rules')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      quiet_hours_start: houseRules?.quiet_hours_start || '',
      quiet_hours_end: houseRules?.quiet_hours_end || '',
      guests_allowed: houseRules?.guests_allowed ?? true,
      max_guests: houseRules?.max_guests || 2,
      smoking_allowed: houseRules?.smoking_allowed ?? false,
      pets_allowed: houseRules?.pets_allowed ?? false,
      custom_rules: houseRules?.custom_rules || ''
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#484848]">📜 Edit House Rules</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-[#5d41ab] text-white rounded-xl hover:bg-[#4c2d87] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Rules'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quiet Hours */}
          <div>
            <label className="block text-sm font-medium text-[#484848] mb-2">
              🤫 Quiet Hours
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="time"
                value={formData.quiet_hours_start}
                onChange={(e) => setFormData({ ...formData, quiet_hours_start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5d41ab] text-[#484848]"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                value={formData.quiet_hours_end}
                onChange={(e) => setFormData({ ...formData, quiet_hours_end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5d41ab] text-[#484848]"
              />
            </div>
          </div>

          {/* Guests */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="guests_allowed"
                checked={formData.guests_allowed}
                onChange={(e) => setFormData({ ...formData, guests_allowed: e.target.checked })}
                className="w-5 h-5 text-[#5d41ab] rounded focus:ring-[#5d41ab] text-[#484848]"
              />
              <label htmlFor="guests_allowed" className="text-sm font-medium text-[#484848]">
                👥 Guests Allowed
              </label>
            </div>
            {formData.guests_allowed && (
              <div className="ml-8">
                <label className="block text-sm text-gray-600 mb-2">Maximum number of guests</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_guests}
                  onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5d41ab] text-[#484848] w-24"
                />
              </div>
            )}
          </div>

          {/* Smoking */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="smoking_allowed"
              checked={formData.smoking_allowed}
              onChange={(e) => setFormData({ ...formData, smoking_allowed: e.target.checked })}
              className="w-5 h-5 text-[#5d41ab] rounded focus:ring-[#5d41ab] text-[#484848]"
            />
            <label htmlFor="smoking_allowed" className="text-sm font-medium text-[#484848]">
              🚬 Smoking Allowed
            </label>
          </div>

          {/* Pets */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="pets_allowed"
              checked={formData.pets_allowed}
              onChange={(e) => setFormData({ ...formData, pets_allowed: e.target.checked })}
              className="w-5 h-5 text-[#5d41ab] rounded focus:ring-[#5d41ab] text-[#484848]"
            />
            <label htmlFor="pets_allowed" className="text-sm font-medium text-[#484848]">
              🐾 Pets Allowed
            </label>
          </div>

          {/* Custom Rules */}
          <div>
            <label className="block text-sm font-medium text-[#484848] mb-2">
              📝 Custom Rules
            </label>
            <textarea
              value={formData.custom_rules}
              onChange={(e) => setFormData({ ...formData, custom_rules: e.target.value })}
              placeholder="Add any additional house rules or agreements..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5d41ab] text-[#484848] resize-none"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#484848]">📜 House Rules</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-[#5d41ab] text-white rounded-xl hover:bg-[#4c2d87] transition-colors"
        >
          Edit Rules
        </button>
      </div>

      {houseRules ? (
        <div className="space-y-4">
          {/* Quiet Hours */}
          {houseRules.quiet_hours_start && houseRules.quiet_hours_end && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <span className="text-2xl">🤫</span>
              <div>
                <h3 className="font-medium text-[#484848] mb-1">Quiet Hours</h3>
                <p className="text-sm text-gray-600">
                  {houseRules.quiet_hours_start} - {houseRules.quiet_hours_end}
                </p>
              </div>
            </div>
          )}

          {/* Guests */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl">👥</span>
            <div>
              <h3 className="font-medium text-[#484848] mb-1">Guests</h3>
              <p className="text-sm text-gray-600">
                {houseRules.guests_allowed
                  ? `Allowed (max ${houseRules.max_guests || 'unlimited'})`
                  : 'Not allowed'}
              </p>
            </div>
          </div>

          {/* Smoking */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl">🚬</span>
            <div>
              <h3 className="font-medium text-[#484848] mb-1">Smoking</h3>
              <p className="text-sm text-gray-600">
                {houseRules.smoking_allowed ? 'Allowed' : 'Not allowed'}
              </p>
            </div>
          </div>

          {/* Pets */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl">🐾</span>
            <div>
              <h3 className="font-medium text-[#484848] mb-1">Pets</h3>
              <p className="text-sm text-gray-600">
                {houseRules.pets_allowed ? 'Allowed' : 'Not allowed'}
              </p>
            </div>
          </div>

          {/* Custom Rules */}
          {houseRules.custom_rules && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📝</span>
                <div className="flex-1">
                  <h3 className="font-medium text-[#484848] mb-2">Additional Rules</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {houseRules.custom_rules}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No house rules set yet</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-[#5d41ab] text-white rounded-xl hover:bg-[#4c2d87] transition-colors"
          >
            Create House Rules
          </button>
        </div>
      )}
    </div>
  )
}
