'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'
import { coliving } from '@/lib/api'

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
  images: any[]
  rooms: Room[]
  house_rules: any
  members: any[]
  average_rating: number | null
  available_rooms_count: number
  created_at: string
}

interface Room {
  id: string
  name: string
  room_type: 'bedroom' | 'shared_bedroom' | 'studio' | 'master_bedroom'
  description: string
  size_sqft: number | null
  has_private_bathroom: boolean
  has_balcony: boolean
  has_closet: boolean
  furnished: boolean
  air_conditioning: boolean
  is_available: boolean
  monthly_rent: number | null
  security_deposit: number | null
  available_from: string | null
  lease_duration_months: number | null
  max_occupancy: number
  current_occupant: any | null
  images: any[]
  compatibility_score?: number
}

export default function CoLivingPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [livingSpaces, setLivingSpaces] = useState<LivingSpace[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showRoomDetails, setShowRoomDetails] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [formData, setFormData] = useState({
    name: '',
    space_type: 'apartment',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
    total_bedrooms: 1,
    total_bathrooms: 1,
    total_rent: '',
    utilities_included: false,
    furnished: false,
    parking_available: false,
    available_from: '',
    lease_duration_months: 12,
    is_public: true
  })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchLivingSpaces()
  }, [])

  const fetchLivingSpaces = async () => {
    try {
      const spaces = await coliving.getLivingSpaces()
      setLivingSpaces(spaces)
    } catch (error) {
      console.error('Failed to fetch living spaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewSpaceDetails = (space: LivingSpace) => {
    router.push(`/dashboard/coliving/${space.id}`)
  }

  const viewRoomDetails = (room: Room) => {
    setSelectedRoom(room)
    setShowRoomDetails(true)
  }

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const spaceData = {
        ...formData,
        total_rent: parseFloat(formData.total_rent) || 0,
        available_from: formData.available_from || new Date().toISOString().split('T')[0]
      }

      await coliving.createLivingSpace(spaceData)
      setShowCreateForm(false)
      setFormData({
        name: '',
        space_type: 'apartment',
        description: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'US',
        total_bedrooms: 1,
        total_bathrooms: 1,
        total_rent: '',
        utilities_included: false,
        furnished: false,
        parking_available: false,
        available_from: '',
        lease_duration_months: 12,
        is_public: true
      })
      fetchLivingSpaces() // Refresh the list
    } catch (error) {
      console.error('Failed to create living space:', error)
      alert('Failed to create living space. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5d41ab] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading living spaces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
      {/* Room Details Modal */}
      {showRoomDetails && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold">{selectedRoom.name}</h2>
                <button
                  onClick={() => setShowRoomDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl sm:text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Room Type</label>
                    <p className="capitalize">{selectedRoom.room_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Monthly Rent</label>
                    <p className="font-bold text-green-600">${selectedRoom.monthly_rent || 'TBD'}</p>
                  </div>
                </div>

                {selectedRoom.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p>{selectedRoom.description}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-3 sm:space-x-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowRoomDetails(false)}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                  {selectedRoom.is_available && (
                    <Button
                      onClick={() => {
                        // Find parent space and redirect to details
                        const parentSpace = livingSpaces.find(space =>
                          space.rooms.some(room => room.id === selectedRoom.id)
                        )
                        if (parentSpace) {
                          viewSpaceDetails(parentSpace)
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      View Space Details
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Space Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateSpace} className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#484848]">Create New Living Space</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Space Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Cozy Downtown Apartment"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Space Type *</label>
                    <select
                      value={formData.space_type}
                      onChange={(e) => setFormData({ ...formData, space_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                      required
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your living space..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      placeholder="ZIP Code"
                      required
                    />
                  </div>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms *</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.total_bedrooms}
                      onChange={(e) => setFormData({ ...formData, total_bedrooms: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms *</label>
                    <Input
                      type="number"
                      min="1"
                      step="0.5"
                      value={formData.total_bathrooms}
                      onChange={(e) => setFormData({ ...formData, total_bathrooms: parseFloat(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Rent ($) *</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.total_rent}
                      onChange={(e) => setFormData({ ...formData, total_rent: e.target.value })}
                      placeholder="e.g., 2500"
                      required
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Features</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.utilities_included}
                        onChange={(e) => setFormData({ ...formData, utilities_included: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Utilities Included</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.furnished}
                        onChange={(e) => setFormData({ ...formData, furnished: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Furnished</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.parking_available}
                        onChange={(e) => setFormData({ ...formData, parking_available: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Parking Available</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_public}
                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Make Public (visible to all users)</span>
                    </label>
                  </div>
                </div>

                {/* Lease Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                    <Input
                      type="date"
                      value={formData.available_from}
                      onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lease Duration (months)</label>
                    <select
                      value={formData.lease_duration_months}
                      onChange={(e) => setFormData({ ...formData, lease_duration_months: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                    >
                      <option value={3}>3 months</option>
                      <option value={6}>6 months</option>
                      <option value={12}>12 months</option>
                      <option value={18}>18 months</option>
                      <option value={24}>24 months</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="w-full sm:w-auto"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-[#5d41ab] hover:bg-[#4c2d87]"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Space'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#484848] mb-4">
            Living Spaces
            <span className="text-[#5d41ab] block">Management</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#484848] font-light mb-6 sm:mb-8 px-4">
            Create, discover, and manage shared living spaces
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#5d41ab] hover:bg-[#4c2d87] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-medium text-base sm:text-lg w-full sm:w-auto max-w-xs sm:max-w-none"
          >
            Create New Space
          </Button>
        </div>

        {/* View Toggle */}
        {livingSpaces.length > 0 && (
          <div className="flex justify-center sm:justify-end mb-6">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#5d41ab] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-[#5d41ab] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
            </div>
          </div>
        )}

        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8" : "space-y-4"}>
          {livingSpaces.length === 0 ? (
            <div className="md:col-span-2 text-center py-12 sm:py-16 px-4">
              <h3 className="text-xl sm:text-2xl font-bold text-[#484848] mb-4">No Living Spaces Yet</h3>
              <p className="text-[#484848] mb-6 sm:mb-8">Get started by creating your first co-living space</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#5d41ab] hover:bg-[#4c2d87] w-full sm:w-auto"
              >
                Create Your First Space
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            livingSpaces.map((space) => (
              <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Space Images */}
                <div
                  className="relative h-48 bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => viewSpaceDetails(space)}
                >
                  {space.images && space.images.length > 0 ? (
                    <img
                      src={space.images.find(img => img.is_primary)?.image || space.images[0]?.image}
                      alt={space.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center text-gray-400">
                        <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                        <p className="text-sm">No photos yet</p>
                        <p className="text-xs">Click to add images</p>
                      </div>
                    </div>
                  )}
                  {/* Image count overlay */}
                  {space.images && space.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs">
                      +{space.images.length - 1} more
                    </div>
                  )}
                  {/* Click to view overlay */}
                  {space.images && space.images.length > 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="bg-white bg-opacity-90 text-[#484848] px-4 py-2 rounded-lg font-medium">
                        🔍 View Details
                      </div>
                    </div>
                  )}
                  {/* Furnished status overlay */}
                  {space.furnished && (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                      Furnished
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl font-bold text-[#484848] leading-tight">{space.name}</CardTitle>
                      <CardDescription className="text-[#484848] capitalize text-sm">
                        {space.space_type} • {space.city}, {space.state}
                      </CardDescription>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-xl sm:text-2xl font-bold text-[#5d41ab]">${space.total_rent}</p>
                      <p className="text-sm text-gray-600">total rent/month</p>
                      {space.rooms.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Rooms from ${Math.min(...space.rooms.filter(r => r.monthly_rent).map(r => r.monthly_rent || 0))}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Property Details */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-bold text-[#484848]">{space.total_bedrooms}</p>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">Bedrooms</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-bold text-[#484848]">{space.total_bathrooms}</p>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">Bathrooms</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-bold text-[#484848]">{space.rooms.length}</p>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">Rooms</p>
                    </div>
                  </div>

                  {/* Features Tags */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {space.furnished && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Fully Furnished</span>
                      )}
                      {space.utilities_included && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">All Utils Included</span>
                      )}
                      {space.parking_available && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Parking Available</span>
                      )}
                      {space.available_rooms_count > 0 && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                          {space.available_rooms_count} rooms available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Available Rooms */}
                  <div className="mb-4">
                    <h4 className="font-medium text-[#484848] mb-2">Available Rooms</h4>
                    {space.rooms.filter(room => room.is_available).slice(0, 2).map((room) => (
                      <div
                        key={room.id}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 gap-2 sm:gap-0"
                        onClick={() => viewRoomDetails(room)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{room.name}</p>
                          <p className="text-xs text-gray-600 capitalize">{room.room_type.replace('_', ' ')}</p>
                          {room.size_sqft && (
                            <p className="text-xs text-gray-500">{room.size_sqft} sq ft</p>
                          )}
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="font-bold text-[#5d41ab]">${room.monthly_rent || 'TBD'}</p>
                          <p className="text-xs text-gray-600">per month</p>
                          {room.compatibility_score && (
                            <p className="text-xs text-green-600 font-medium">{room.compatibility_score}% match</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {space.rooms.filter(room => room.is_available).length > 2 && (
                      <p className="text-xs text-gray-600 text-center">+{space.rooms.filter(room => room.is_available).length - 2} more available rooms</p>
                    )}
                    {space.available_rooms_count === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">No rooms currently available</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => viewSpaceDetails(space)}
                      variant="outline"
                      className="w-full"
                    >
                      View Details
                    </Button>
                    {user && space.members?.some(m => m.user_id === user.id && m.role === 'admin') && (
                      <Button
                        onClick={() => router.push(`/dashboard/coliving/${space.id}`)}
                        className="w-full bg-[#5d41ab] hover:bg-[#4c2d87]"
                      >
                        Manage Space
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // List View
            livingSpaces.map((space) => (
              <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row">
                  {/* Image Section */}
                  <div
                    className="relative w-full sm:w-48 h-32 sm:h-auto bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                    onClick={() => viewSpaceDetails(space)}
                  >
                    {space.images && space.images.length > 0 ? (
                      <img
                        src={space.images.find(img => img.is_primary)?.image || space.images[0]?.image}
                        alt={space.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <div className="text-center text-gray-400">
                          <svg className="mx-auto h-8 w-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                          <p className="text-xs">No photos</p>
                        </div>
                      </div>
                    )}
                    {/* Image count overlay */}
                    {space.images && space.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs">
                        +{space.images.length - 1}
                      </div>
                    )}
                    {/* Furnished status overlay */}
                    {space.furnished && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        Furnished
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      {/* Left Content */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-[#484848] mb-1">{space.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">
                              {space.space_type} • {space.city}, {space.state}
                            </p>
                          </div>
                          <div className="text-left sm:text-right mt-2 sm:mt-0">
                            <p className="text-xl sm:text-2xl font-bold text-[#5d41ab]">${space.total_rent}</p>
                            <p className="text-xs text-gray-600">total rent/month</p>
                          </div>
                        </div>

                        {/* Property Stats */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">{space.total_bedrooms}</span>
                            <span className="ml-1">bed</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">{space.total_bathrooms}</span>
                            <span className="ml-1">bath</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">{space.rooms.length}</span>
                            <span className="ml-1">rooms</span>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {space.furnished && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Furnished</span>
                          )}
                          {space.utilities_included && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Utilities Included</span>
                          )}
                          {space.parking_available && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Parking</span>
                          )}
                          {space.available_rooms_count > 0 && (
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                              {space.available_rooms_count} available
                            </span>
                          )}
                        </div>

                        {/* Available Rooms Summary */}
                        {space.rooms.filter(room => room.is_available).length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">Available Rooms:</p>
                            <div className="flex flex-wrap gap-2">
                              {space.rooms.filter(room => room.is_available).slice(0, 3).map((room) => (
                                <div
                                  key={room.id}
                                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                                  onClick={() => viewRoomDetails(room)}
                                >
                                  {room.name} - ${room.monthly_rent || 'TBD'}
                                </div>
                              ))}
                              {space.rooms.filter(room => room.is_available).length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{space.rooms.filter(room => room.is_available).length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => viewSpaceDetails(space)}
                            variant="outline"
                            className="text-sm"
                          >
                            View Details
                          </Button>
                          {user && space.members?.some(m => m.user_id === user.id && m.role === 'admin') && (
                            <Button
                              onClick={() => router.push(`/dashboard/coliving/${space.id}`)}
                              className="bg-[#5d41ab] hover:bg-[#4c2d87] text-sm"
                            >
                              Manage Space
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}