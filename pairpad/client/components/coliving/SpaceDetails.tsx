'use client'

import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LivingSpace {
  id: string
  name: string
  space_type: 'apartment' | 'house' | 'condo' | 'townhouse'
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  total_bedrooms: number
  total_bathrooms: number
  total_rent: number
  utilities_included: boolean
  furnished: boolean
  parking_available: boolean
  available_from: string
  lease_duration_months: number
  is_public: boolean
  is_active: boolean
}

interface SpaceDetailsProps {
  space: LivingSpace
  editMode: boolean
  editData: Partial<LivingSpace>
  onEditData: (data: Partial<LivingSpace>) => void
}

export default function SpaceDetails({
  space,
  editMode,
  editData,
  onEditData
}: SpaceDetailsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-[#484848]">Space Details</CardTitle>
      </CardHeader>
      <CardContent>
        {editMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#484848] mb-2">Space Name</label>
              <Input
                value={editData.name || ''}
                onChange={(e) => onEditData({ ...editData, name: e.target.value })}
                className="rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#484848] mb-2">Space Type</label>
              <select
                value={editData.space_type || ''}
                onChange={(e) => onEditData({ ...editData, space_type: e.target.value as LivingSpace['space_type'] })}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#484848] mb-2">Description</label>
              <textarea
                value={editData.description || ''}
                onChange={(e) => onEditData({ ...editData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#484848] mb-2">Total Rent ($)</label>
              <Input
                type="number"
                value={editData.total_rent || ''}
                onChange={(e) => onEditData({ ...editData, total_rent: parseInt(e.target.value) || 0 })}
                className="rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#484848] mb-2">Lease Duration (months)</label>
              <Input
                type="number"
                value={editData.lease_duration_months || ''}
                onChange={(e) => onEditData({ ...editData, lease_duration_months: parseInt(e.target.value) || 12 })}
                className="rounded-2xl"
              />
            </div>
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editData.furnished || false}
                    onChange={(e) => onEditData({ ...editData, furnished: e.target.checked })}
                    className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                  />
                  <label className="ml-2 text-sm text-[#484848]">Furnished</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editData.utilities_included || false}
                    onChange={(e) => onEditData({ ...editData, utilities_included: e.target.checked })}
                    className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                  />
                  <label className="ml-2 text-sm text-[#484848]">Utilities Included</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editData.parking_available || false}
                    onChange={(e) => onEditData({ ...editData, parking_available: e.target.checked })}
                    className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                  />
                  <label className="ml-2 text-sm text-[#484848]">Parking Available</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editData.is_public || false}
                    onChange={(e) => onEditData({ ...editData, is_public: e.target.checked })}
                    className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                  />
                  <label className="ml-2 text-sm text-[#484848]">Public Listing</label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[#484848] mb-4">{space.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-700">Bedrooms</p>
                <p className="font-medium text-gray-800">{space.total_bedrooms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Bathrooms</p>
                <p className="font-medium text-gray-800">{space.total_bathrooms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Type</p>
                <p className="font-medium text-gray-800 capitalize">{space.space_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Lease Duration</p>
                <p className="font-medium text-gray-800">{space.lease_duration_months} months</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {space.furnished && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Furnished</span>
              )}
              {space.utilities_included && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Utils Included</span>
              )}
              {space.parking_available && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Parking</span>
              )}
              {space.is_public && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">Public Listing</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}