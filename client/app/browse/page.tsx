'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function BrowsePage() {
  const router = useRouter()
  const [livingSpaces, setLivingSpaces] = useState<LivingSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    city: '',
    min_budget: '',
    max_budget: '',
    furnished: '',
    utilities_included: '',
    space_type: '',
    available_rooms_only: false,
  })

  useEffect(() => {
    fetchPublicSpaces()
  }, [])

  const fetchPublicSpaces = async () => {
    try {
      const data = await coliving.searchSpaces({
        ...filters,
        search: searchQuery,
      })
      setLivingSpaces(data.results || data)
    } catch (error) {
      console.error('Failed to fetch living spaces:', error)
      // Fallback to basic fetch if search fails
      try {
        const basicData = await coliving.getLivingSpaces()
        setLivingSpaces(basicData.filter((space: LivingSpace) => space.is_public))
      } catch (fallbackError) {
        console.error('Failed to fetch any spaces:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setLoading(true)
    fetchPublicSpaces()
  }

  const clearFilters = () => {
    setFilters({
      city: '',
      min_budget: '',
      max_budget: '',
      furnished: '',
      utilities_included: '',
      space_type: '',
      available_rooms_only: false,
    })
    setSearchQuery('')
    setLoading(true)
    fetchPublicSpaces()
  }

  const viewSpaceDetails = (spaceId: string) => {
    router.push(`/browse/${spaceId}`)
  }


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
          <p className="text-[#484848] text-xl">Finding amazing living spaces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
      {/* Image Gallery Modal */}
      {showImageGallery && gallerySpace && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="max-w-7xl mx-auto px-4 py-8 w-full h-full flex flex-col">
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
              <div className="flex-1 relative">
                {galleryImages.length > 0 ? (
                  <>
                    <img
                      src={galleryImages[currentImageIndex]?.image}
                      alt={`${gallerySpace.name} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain rounded-lg"
                    />

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
              </div>
            </div>

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

      {/* Header */}
      <div className="bg-gradient-to-br from-[#5d41ab] to-[#4c2d87] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-4">
              Find Your Perfect
              <span className="block">Living Space</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Discover amazing co-living spaces, connect with compatible roommates, and find your ideal home
            </p>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl p-2 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-2">
                  <Input
                    placeholder="Search by location, neighborhood, or space name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 bg-transparent text-[#484848] placeholder-gray-400 text-lg py-4 px-6 rounded-2xl"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    onClick={handleSearch}
                    className="bg-[#5d41ab] hover:bg-[#4c2d87] text-white px-8 py-4 rounded-2xl font-medium text-lg"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Your Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">City</label>
                <Input
                  placeholder="Any city"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Min Budget ($)</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_budget}
                  onChange={(e) => setFilters({ ...filters, min_budget: e.target.value })}
                  className="rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Max Budget ($)</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_budget}
                  onChange={(e) => setFilters({ ...filters, max_budget: e.target.value })}
                  className="rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Space Type</label>
                <select
                  value={filters.space_type}
                  onChange={(e) => setFilters({ ...filters, space_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                >
                  <option value="">Any type</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Furnished</label>
                <select
                  value={filters.furnished}
                  onChange={(e) => setFilters({ ...filters, furnished: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                >
                  <option value="">Any</option>
                  <option value="true">Furnished</option>
                  <option value="false">Unfurnished</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Utilities</label>
                <select
                  value={filters.utilities_included}
                  onChange={(e) => setFilters({ ...filters, utilities_included: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                >
                  <option value="">Any</option>
                  <option value="true">Included</option>
                  <option value="false">Separate</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.available_rooms_only}
                  onChange={(e) => setFilters({ ...filters, available_rooms_only: e.target.checked })}
                  className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                />
                <label className="ml-2 text-sm text-[#484848]">Only show spaces with available rooms</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSearch} className="bg-[#5d41ab] hover:bg-[#4c2d87]">
                Apply Filters
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#484848]">
              {livingSpaces.length} Living Spaces Found
            </h2>
            <p className="text-gray-600">Find your perfect roommate match</p>
          </div>
          <Button
            onClick={() => router.push('/login')}
            className="bg-[#5d41ab] hover:bg-[#4c2d87]"
          >
            Join PairPad
          </Button>
        </div>

        {/* Living Spaces Grid */}
        <div className="grid lg:grid-cols-1 xl:grid-cols-2 gap-8">
          {livingSpaces.length === 0 ? (
            <div className="xl:col-span-2 text-center py-16">
              <h3 className="text-2xl font-bold text-[#484848] mb-4">No spaces found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            livingSpaces.map((space) => (
              <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div
                  className="relative h-48 bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => viewSpaceDetails(space.id)}
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
                        <p className="text-sm">No photos available</p>
                      </div>
                    </div>
                  )}

                  {space.images && space.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs">
                      +{space.images.length - 1} more
                    </div>
                  )}

                  {space.images && space.images.length > 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="bg-white bg-opacity-90 text-[#484848] px-4 py-2 rounded-lg font-medium">
                        🔍 View Gallery & Amenities
                      </div>
                    </div>
                  )}

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

                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-[#484848] mb-2">Available Rooms ({space.available_rooms_count})</h4>
                    {space.rooms.filter(room => room.is_available).slice(0, 2).map((room) => (
                      <div
                        key={room.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2 border border-gray-200"
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
                      onClick={() => viewSpaceDetails(space.id)}
                      variant="outline"
                      className="w-full"
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => router.push('/register')}
                      className="w-full bg-[#5d41ab] hover:bg-[#4c2d87]"
                    >
                      Apply to Live Here
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-12">
          <h3 className="text-3xl font-bold text-[#484848] mb-4">Ready to Find Your Perfect Roommate?</h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join PairPad today and get matched with compatible roommates based on your personality and lifestyle preferences
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push('/register')}
              className="bg-[#5d41ab] hover:bg-[#4c2d87] text-white px-8 py-4 rounded-2xl font-medium text-lg"
            >
              Join PairPad Free
            </Button>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="px-8 py-4 rounded-2xl font-medium text-lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}