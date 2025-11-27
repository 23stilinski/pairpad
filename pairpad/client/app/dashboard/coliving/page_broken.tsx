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
  current_occupant: any
  images: any[]
  compatibility_score: number | null
}

interface CreateLivingSpaceData {
  name: string
  space_type: string
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
  house_rules: {
    quiet_hours_start: string
    quiet_hours_end: string
    overnight_guests_allowed: boolean
    max_consecutive_guest_nights: number
    guest_notification_required: boolean
    cleaning_schedule: string
    shared_chores_rotation: boolean
    smoking_allowed: boolean
    pets_allowed: boolean
    alcohol_allowed: boolean
    custom_rules: string
  }
}

export default function CoLivingPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [livingSpaces, setLivingSpaces] = useState<LivingSpace[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showRoomDetails, setShowRoomDetails] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)

  const [newSpace, setNewSpace] = useState<CreateLivingSpaceData>({
    name: '',
    space_type: 'apartment',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    total_bedrooms: 1,
    total_bathrooms: 1,
    total_rent: 0,
    utilities_included: false,
    furnished: false,
    parking_available: false,
    available_from: '',
    lease_duration_months: 12,
    is_public: true,
    house_rules: {
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      overnight_guests_allowed: true,
      max_consecutive_guest_nights: 3,
      guest_notification_required: true,
      cleaning_schedule: 'weekly',
      shared_chores_rotation: true,
      smoking_allowed: false,
      pets_allowed: false,
      alcohol_allowed: true,
      custom_rules: ''
    }
  })

  useEffect(() => {
    fetchLivingSpaces()
  }, [])

  const fetchLivingSpaces = async () => {
    try {
      const data = await coliving.getLivingSpaces()
      setLivingSpaces(data)
    } catch (error) {
      console.error('Failed to fetch living spaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const createLivingSpace = async () => {
    try {
      const created = await coliving.createLivingSpace(newSpace)
      setLivingSpaces([...livingSpaces, created])
      setShowCreateForm(false)
      setNewSpace({
        name: '',
        space_type: 'apartment',
        description: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'United States',
        total_bedrooms: 1,
        total_bathrooms: 1,
        total_rent: 0,
        utilities_included: false,
        furnished: false,
        parking_available: false,
        available_from: '',
        lease_duration_months: 12,
        is_public: true,
        house_rules: {
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          overnight_guests_allowed: true,
          max_consecutive_guest_nights: 3,
          guest_notification_required: true,
          cleaning_schedule: 'weekly',
          shared_chores_rotation: true,
          smoking_allowed: false,
          pets_allowed: false,
          alcohol_allowed: true,
          custom_rules: ''
        }
      })
    } catch (error) {
      console.error('Failed to create living space:', error)
    }
  }

  const viewRoomDetails = (room: Room) => {
    setSelectedRoom(room)
    setShowRoomDetails(true)
  }

  const viewSpaceDetails = (space: LivingSpace) => {
    router.push(`/dashboard/coliving/${space.id}`)
  }


  // Mock amenities data - in real app this would come from the API
  const getSpaceAmenities = (space: LivingSpace) => {
    const baseAmenities = [
      { name: 'WiFi Internet', icon: '📶', included: true },
      { name: 'Washing Machine', icon: '🧺', included: true },
      { name: 'Dryer', icon: '🧺', included: true },
      { name: 'Dishwasher', icon: '🍽️', included: true },
      { name: 'Microwave', icon: '📡', included: true },
      { name: 'Coffee Maker', icon: '☕', included: true },
      { name: 'TV', icon: '📺', included: true },
      { name: 'Sofa/Couch', icon: '🛋️', included: true },
      { name: 'Dining Table', icon: '🍽️', included: true },
    ]

    const furnishedAmenities = [
      { name: 'Bed & Mattress', icon: '🛏️', included: space.furnished },
      { name: 'Wardrobe/Closet', icon: '👔', included: space.furnished },
      { name: 'Desk & Chair', icon: '💺', included: space.furnished },
      { name: 'Bedside Table', icon: '🪑', included: space.furnished },
      { name: 'Curtains/Blinds', icon: '🪟', included: space.furnished },
      { name: 'Lamps', icon: '💡', included: space.furnished },
    ]

    const kitchenAmenities = [
      { name: 'Refrigerator', icon: '🧊', included: true },
      { name: 'Stove/Cooktop', icon: '🔥', included: true },
      { name: 'Oven', icon: '🔥', included: true },
      { name: 'Pots & Pans', icon: '🍳', included: space.furnished },
      { name: 'Plates & Utensils', icon: '🍽️', included: space.furnished },
      { name: 'Toaster', icon: '🍞', included: space.furnished },
    ]

    const utilityAmenities = [
      { name: 'Electricity', icon: '⚡', included: space.utilities_included },
      { name: 'Water', icon: '💧', included: space.utilities_included },
      { name: 'Gas', icon: '🔥', included: space.utilities_included },
      { name: 'Trash Collection', icon: '🗑️', included: space.utilities_included },
      { name: 'Internet', icon: '🌐', included: space.utilities_included },
    ]

    return {
      'Living Essentials': baseAmenities,
      'Furniture (if furnished)': furnishedAmenities,
      'Kitchen Appliances': kitchenAmenities,
      'Utilities': utilityAmenities,
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#5d41ab] mx-auto mb-4"></div>
          <p className="text-[#484848] text-xl">Loading living spaces...</p>
        </div>
      </div>
    )
  }

  if (showRoomDetails && selectedRoom) {
    return (
      <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-8">
            <button
              onClick={() => setShowRoomDetails(false)}
              className="text-[#5d41ab] hover:text-[#4c2d87] font-medium mb-4"
            >
              ← Back to living spaces
            </button>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#484848] mb-4">
              {selectedRoom.name}
            </h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Room Images */}
              <Card className="mb-6 overflow-hidden">
                <div
                  className="relative h-64 bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    // For room images, we need to find the parent space
                    const parentSpace = livingSpaces.find(space =>
                      space.rooms.some(room => room.id === selectedRoom.id)
                    )
                    if (parentSpace) {
                      viewSpaceDetails(parentSpace)
                    }
                  }}
                >
                  {selectedRoom.images && selectedRoom.images.length > 0 ? (
                    <img
                      src={selectedRoom.images.find(img => img.is_primary)?.image || selectedRoom.images[0]?.image}
                      alt={selectedRoom.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center text-gray-400">
                        <svg className="mx-auto h-16 w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No room photos available</p>
                        <p className="text-xs">Click to view space amenities</p>
                      </div>
                    </div>
                  )}

                  {/* Image count overlay */}
                  {selectedRoom.images && selectedRoom.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                      +{selectedRoom.images.length - 1} photos
                    </div>
                  )}

                  {/* Click to view overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="bg-white bg-opacity-90 text-[#484848] px-4 py-2 rounded-lg font-medium">
                      🏠 View Space Gallery & Amenities
                    </div>
                  </div>

                  {/* Furnished status overlay */}
                  {selectedRoom.furnished && (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                      Furnished Room
                    </div>
                  )}

                  {/* Availability status */}
                  <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-lg text-sm font-medium ${
                    selectedRoom.is_available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {selectedRoom.is_available ? 'Available Now' : 'Not Available'}
                  </div>
                </div>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Room Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Rent & Financial Details */}
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-3">Monthly Costs</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-yellow-700">Room Rent</p>
                        <p className="text-2xl font-bold text-[#5d41ab]">${selectedRoom.monthly_rent || 'TBD'}</p>
                        <p className="text-xs text-yellow-600">per month</p>
                      </div>
                      <div>
                        <p className="text-sm text-yellow-700">Security Deposit</p>
                        <p className="text-xl font-bold text-yellow-800">${selectedRoom.security_deposit || 'TBD'}</p>
                        <p className="text-xs text-yellow-600">one-time</p>
                      </div>
                    </div>
                    {selectedRoom.available_from && (
                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <p className="text-sm text-yellow-700">Available from: <span className="font-medium">{new Date(selectedRoom.available_from).toLocaleDateString()}</span></p>
                      </div>
                    )}
                  </div>

                  {/* Room Specifications */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Room Type</p>
                      <p className="font-medium capitalize">{selectedRoom.room_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Room Size</p>
                      <p className="font-medium">{selectedRoom.size_sqft ? `${selectedRoom.size_sqft} sq ft` : 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Furnished</p>
                      <p className="font-medium">{selectedRoom.furnished ? 'Yes - Fully Furnished' : 'No - Bring Your Own'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Status</p>
                      <p className={`font-medium ${selectedRoom.is_available ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedRoom.is_available ? 'Available' : 'Occupied'}
                      </p>
                    </div>
                  </div>

                  {/* Room Features */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Room Features & Amenities</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`flex items-center p-2 rounded-lg ${selectedRoom.has_private_bathroom ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500'}`}>
                        <span className="text-sm font-medium">
                          {selectedRoom.has_private_bathroom ? '✓' : '✗'} Private Bathroom
                        </span>
                      </div>
                      <div className={`flex items-center p-2 rounded-lg ${selectedRoom.has_balcony ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-500'}`}>
                        <span className="text-sm font-medium">
                          {selectedRoom.has_balcony ? '✓' : '✗'} Balcony/Terrace
                        </span>
                      </div>
                      <div className={`flex items-center p-2 rounded-lg ${selectedRoom.has_closet ? 'bg-purple-50 text-purple-800' : 'bg-gray-50 text-gray-500'}`}>
                        <span className="text-sm font-medium">
                          {selectedRoom.has_closet ? '✓' : '✗'} Built-in Closet
                        </span>
                      </div>
                      <div className={`flex items-center p-2 rounded-lg ${selectedRoom.air_conditioning ? 'bg-cyan-50 text-cyan-800' : 'bg-gray-50 text-gray-500'}`}>
                        <span className="text-sm font-medium">
                          {selectedRoom.air_conditioning ? '✓' : '✗'} Air Conditioning
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedRoom.description && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Room Description</p>
                      <p className="text-[#484848]">{selectedRoom.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Compatibility Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${
                      selectedRoom.compatibility_score && selectedRoom.compatibility_score >= 80 ? 'text-green-600' :
                      selectedRoom.compatibility_score && selectedRoom.compatibility_score >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedRoom.compatibility_score || 'N/A'}%
                    </div>
                    <p className="text-gray-600">compatibility with your profile</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedRoom.is_available ? (
                    <Button className="w-full mb-3 bg-[#5d41ab] hover:bg-[#4c2d87]">
                      Apply for This Room
                    </Button>
                  ) : (
                    <Button disabled className="w-full mb-3">
                      Room Not Available
                    </Button>
                  )}
                  <Button variant="outline" className="w-full">
                    Contact Property Manager
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 text-white">
              <div>
                <h2 className="text-2xl font-bold">{gallerySpace.name}</h2>
                <p className="text-gray-300">
                  {currentImageIndex + 1} of {galleryImages.length}
                </p>
              </div>
              <button
                onClick={() => setShowImageGallery(false)}
                className="text-white hover:text-gray-300 text-3xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 flex gap-6">
              {/* Main Image */}
              <div className="flex-1 relative">
                {galleryImages.length > 0 ? (
                  <>
                    <img
                      src={galleryImages[currentImageIndex]?.image}
                      alt={`${gallerySpace.name} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain rounded-lg"
                    />

                    {/* Navigation Arrows */}
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70"
                        >
                          →
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <p>No images available</p>
                  </div>
                )}
              </div>

              {/* Amenities Panel */}
              <div className="w-80 bg-white rounded-lg p-6 overflow-y-auto">
                <h3 className="text-xl font-bold text-[#484848] mb-4">What's Included</h3>

                {Object.entries(getSpaceAmenities(gallerySpace)).map(([category, amenities]) => (
                  <div key={category} className="mb-6">
                    <h4 className="font-medium text-[#484848] mb-3 border-b pb-1">{category}</h4>
                    <div className="space-y-2">
                      {amenities.map((amenity) => (
                        <div
                          key={amenity.name}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            amenity.included ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <span className="text-xl">{amenity.icon}</span>
                          <span className={`text-sm ${
                            amenity.included ? 'text-green-800' : 'text-gray-500'
                          }`}>
                            {amenity.name}
                          </span>
                          <span className="ml-auto">
                            {amenity.included ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-400">✗</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Space Details */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-[#484848] mb-3">Space Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{gallerySpace.space_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bedrooms:</span>
                      <span className="font-medium">{gallerySpace.total_bedrooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bathrooms:</span>
                      <span className="font-medium">{gallerySpace.total_bathrooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Furnished:</span>
                      <span className="font-medium">{gallerySpace.furnished ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilities:</span>
                      <span className="font-medium">{gallerySpace.utilities_included ? 'Included' : 'Separate'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parking:</span>
                      <span className="font-medium">{gallerySpace.parking_available ? 'Available' : 'Not Available'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="mt-6 flex gap-2 justify-center overflow-x-auto pb-4">
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-[#5d41ab]' : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={image.image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#484848] mb-4">
            Living Spaces
            <span className="text-[#5d41ab] block">Management</span>
          </h1>
          <p className="text-xl text-[#484848] font-light mb-8">
            Create, discover, and manage shared living spaces
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#5d41ab] hover:bg-[#4c2d87] text-white px-8 py-4 rounded-2xl font-medium text-lg hover:scale-105 transition-all"
          >
            Create New Living Space
          </Button>
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-bold text-[#484848] mb-6">Create Living Space</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">Space Name</label>
                  <Input
                    value={newSpace.name}
                    onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                    placeholder="e.g., Cozy Downtown Apartment"
                    className="rounded-2xl border-gray-200 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">Space Type</label>
                  <select
                    value={newSpace.space_type}
                    onChange={(e) => setNewSpace({ ...newSpace, space_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-[#5d41ab] focus:border-[#5d41ab]"
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
                    value={newSpace.description}
                    onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                    placeholder="Describe your living space..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">Address</label>
                  <Input
                    value={newSpace.address}
                    onChange={(e) => setNewSpace({ ...newSpace, address: e.target.value })}
                    placeholder="Street address"
                    className="rounded-2xl border-gray-200 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">City</label>
                  <Input
                    value={newSpace.city}
                    onChange={(e) => setNewSpace({ ...newSpace, city: e.target.value })}
                    placeholder="City"
                    className="rounded-2xl border-gray-200 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">State</label>
                  <Input
                    value={newSpace.state}
                    onChange={(e) => setNewSpace({ ...newSpace, state: e.target.value })}
                    placeholder="State"
                    className="rounded-2xl border-gray-200 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">ZIP Code</label>
                  <Input
                    value={newSpace.zip_code}
                    onChange={(e) => setNewSpace({ ...newSpace, zip_code: e.target.value })}
                    placeholder="ZIP Code"
                    className="rounded-2xl border-gray-200 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">Bedrooms</label>
                  <Input
                    type="number"
                    value={newSpace.total_bedrooms}
                    onChange={(e) => setNewSpace({ ...newSpace, total_bedrooms: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="rounded-2xl border-gray-200 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">Bathrooms</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newSpace.total_bathrooms}
                    onChange={(e) => setNewSpace({ ...newSpace, total_bathrooms: parseFloat(e.target.value) || 1 })}
                    min="1"
                    className="rounded-2xl border-gray-200 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">Total Rent ($)</label>
                  <Input
                    type="number"
                    value={newSpace.total_rent}
                    onChange={(e) => setNewSpace({ ...newSpace, total_rent: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="rounded-2xl border-gray-200 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">Available From</label>
                  <Input
                    type="date"
                    value={newSpace.available_from}
                    onChange={(e) => setNewSpace({ ...newSpace, available_from: e.target.value })}
                    className="rounded-2xl border-gray-200 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">Lease Duration (months)</label>
                  <Input
                    type="number"
                    value={newSpace.lease_duration_months}
                    onChange={(e) => setNewSpace({ ...newSpace, lease_duration_months: parseInt(e.target.value) || 12 })}
                    min="1"
                    className="rounded-2xl border-gray-200 focus:ring-[#5d41ab] focus:border-[#5d41ab]"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newSpace.utilities_included}
                        onChange={(e) => setNewSpace({ ...newSpace, utilities_included: e.target.checked })}
                        className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                      />
                      <label className="ml-2 text-sm text-[#484848]">Utilities Included</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newSpace.furnished}
                        onChange={(e) => setNewSpace({ ...newSpace, furnished: e.target.checked })}
                        className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                      />
                      <label className="ml-2 text-sm text-[#484848]">Furnished</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newSpace.parking_available}
                        onChange={(e) => setNewSpace({ ...newSpace, parking_available: e.target.checked })}
                        className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                      />
                      <label className="ml-2 text-sm text-[#484848]">Parking Available</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newSpace.is_public}
                        onChange={(e) => setNewSpace({ ...newSpace, is_public: e.target.checked })}
                        className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                      />
                      <label className="ml-2 text-sm text-[#484848]">Make Public (allow others to discover)</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#484848] mb-2">Space Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      // Handle image uploads - placeholder for now
                      console.log('Images selected:', e.target.files)
                    }}
                    className="hidden"
                    id="space-images"
                  />
                  <label htmlFor="space-images" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-gray-600">Click to upload space images</p>
                    <p className="text-sm text-gray-400">PNG, JPG up to 10MB each</p>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  onClick={createLivingSpace}
                  className="bg-[#5d41ab] hover:bg-[#4c2d87] text-white px-8 py-3 rounded-2xl font-medium"
                >
                  Create Space
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="px-8 py-3 rounded-2xl font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-1 xl:grid-cols-2 gap-8">
          {livingSpaces.length === 0 ? (
            <div className="xl:col-span-2 text-center py-16">
              <h3 className="text-2xl font-bold text-[#484848] mb-4">No Living Spaces Yet</h3>
              <p className="text-gray-600 mb-6">Create your first living space to get started</p>
            </div>
          ) : (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                        🔍 View Gallery & Amenities
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
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-[#484848]">{space.name}</CardTitle>
                      <CardDescription className="capitalize">{space.space_type} • {space.city}, {space.state}</CardDescription>
                      <p className="text-sm text-gray-500 mt-1">{space.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#5d41ab]">${space.total_rent}</p>
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
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bedrooms:</span>
                        <span className="font-medium">{space.total_bedrooms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bathrooms:</span>
                        <span className="font-medium">{space.total_bathrooms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Furnished:</span>
                        <span className="font-medium">{space.furnished ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Utilities:</span>
                        <span className="font-medium">{space.utilities_included ? 'Included' : 'Separate'}</span>
                      </div>
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

                  {/* Rent Structure */}
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-sm text-yellow-800 mb-2">Rent Structure</h4>
                    <p className="text-sm text-yellow-700">
                      <strong>${space.total_rent}/month</strong> total space rent
                      {space.rooms.length > 0 && (
                        <span className="block mt-1">
                          Individual rooms: ${Math.min(...space.rooms.filter(r => r.monthly_rent).map(r => r.monthly_rent || 0))} - ${Math.max(...space.rooms.filter(r => r.monthly_rent).map(r => r.monthly_rent || 0))}/month
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Available Rooms */}
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-[#484848] mb-2">Available Rooms ({space.available_rooms_count})</h4>
                    {space.rooms.filter(room => room.is_available).slice(0, 2).map((room) => (
                      <div
                        key={room.id}
                        onClick={() => viewRoomDetails(room)}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2 hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-sm">{room.name}</p>
                          <p className="text-xs text-gray-600 capitalize">{room.room_type.replace('_', ' ')}</p>
                          {room.size_sqft && (
                            <p className="text-xs text-gray-500">{room.size_sqft} sq ft</p>
                          )}
                        </div>
                        <div className="text-right">
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
                      View Gallery & Amenities
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
          )}
        </div>
      </div>
    </div>
  )
}