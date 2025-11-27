'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface HouseRules {
  smoking_allowed?: boolean
  pets_allowed?: boolean
  guests_allowed?: boolean
  quiet_hours?: string
  additional_rules?: string
  cleaning_schedule?: string
  shared_chores_rotation?: boolean
  guest_notification_required?: boolean
  max_consecutive_guest_nights?: number
}

interface HouseRulesProps {
  houseRules: HouseRules | null
  isOwner: boolean
}

export default function HouseRules({ houseRules, isOwner }: HouseRulesProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-[#484848]">House Rules & Preferences</CardTitle>
        <CardDescription className="text-gray-700">Guidelines for living in this space</CardDescription>
      </CardHeader>
      <CardContent>
        {houseRules ? (
          <div className="space-y-4">
            {houseRules.smoking_allowed !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-800">Smoking</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  houseRules.smoking_allowed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {houseRules.smoking_allowed ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
            )}
            {houseRules.pets_allowed !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-800">Pets</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  houseRules.pets_allowed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {houseRules.pets_allowed ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
            )}
            {houseRules.guests_allowed !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-800">Guests</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  houseRules.guests_allowed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {houseRules.guests_allowed ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
            )}
            {houseRules.quiet_hours && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-800">Quiet Hours: </span>
                <span className="text-gray-700">{houseRules.quiet_hours}</span>
              </div>
            )}
            {houseRules.cleaning_schedule && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-800">Cleaning Schedule: </span>
                <span className="text-gray-700 capitalize">{houseRules.cleaning_schedule}</span>
              </div>
            )}
            {houseRules.shared_chores_rotation !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-800">Shared Chores Rotation</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  houseRules.shared_chores_rotation
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {houseRules.shared_chores_rotation ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {houseRules.guest_notification_required !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-800">Guest Notification Required</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  houseRules.guest_notification_required
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {houseRules.guest_notification_required ? 'Required' : 'Not Required'}
                </span>
              </div>
            )}
            {houseRules.max_consecutive_guest_nights !== undefined && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-800">Max Consecutive Guest Nights: </span>
                <span className="text-gray-700">{houseRules.max_consecutive_guest_nights} nights</span>
              </div>
            )}
            {houseRules.additional_rules && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-800 block mb-2">Additional Rules:</span>
                <p className="text-gray-700 text-sm">{houseRules.additional_rules}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-700">
            <p>No house rules specified</p>
            {isOwner && (
              <p className="text-sm mt-2 text-gray-600">Add house rules to help potential roommates understand your preferences</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}