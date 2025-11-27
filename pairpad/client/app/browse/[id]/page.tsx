'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { coliving, auth } from '@/lib/api'
import { ArrowLeft, MapPin, Users, Home, Wifi, Car, Utensils, Sofa, Bath, Bed } from 'lucide-react'

interface LivingSpace {
  id: string
  name: string
  description: string
  address: string
  city: string
  rent_amount: number
  images: any[]
  rooms: any[]
  created_by: any
  utilities_included: boolean
  furnished: boolean
  space_type: string
  amenities: string[]
  house_rules: any[]
}

export default function SpaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const spaceId = params.id as string

  const [space, setSpace] = useState<LivingSpace | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showAllImages, setShowAllImages] = useState(false)

  useEffect(() => {
    fetchSpaceDetails()
  }, [spaceId])

  const fetchSpaceDetails = async () => {
    try {
      const spaceData = await coliving.getLivingSpace(spaceId)
      setSpace(spaceData)
    } catch (error) {
      console.error('Failed to fetch space details:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextImage = () => {
    if (space?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % space.images.length)
    }
  }

  const prevImage = () => {
    if (space?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + space.images.length) % space.images.length)
    }
  }

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase()
    if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="h-4 w-4" />
    if (lower.includes('parking')) return <Car className="h-4 w-4" />
    if (lower.includes('kitchen')) return <Utensils className="h-4 w-4" />
    if (lower.includes('furnished')) return <Sofa className="h-4 w-4" />
    if (lower.includes('bathroom')) return <Bath className="h-4 w-4" />
    if (lower.includes('bedroom')) return <Bed className="h-4 w-4" />
    return <Home className="h-4 w-4" />
  }

  const handleContactOwner = async () => {
    try {
      // Check if user is authenticated
      await auth.getProfile()
      // User is logged in, you can implement contact functionality here
      alert('Contact functionality would be implemented here')
    } catch (error) {
      // User is not logged in, redirect to login
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Space not found</h1>
          <Button onClick={() => router.push('/browse')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button onClick={() => router.push('/browse')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Browse
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image Gallery */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              {space.images && space.images.length > 0 ? (
                <div className="relative">
                  <div className="aspect-video relative bg-gray-200 rounded-t-lg overflow-hidden">
                    <img
                      src={space.images[currentImageIndex]?.image}
                      alt={space.name}
                      className="w-full h-full object-cover"
                    />
                    {space.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                        >
                          →
                        </button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {space.images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Grid */}
                  {space.images.length > 1 && (
                    <div className="p-4">
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {space.images.slice(0, showAllImages ? space.images.length : 6).map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 ${
                              currentImageIndex === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={image.image}
                              alt={`${space.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                        {!showAllImages && space.images.length > 6 && (
                          <button
                            onClick={() => setShowAllImages(true)}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-400"
                          >
                            +{space.images.length - 6}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <Home className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Space Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{space.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{space.address}, {space.city}</span>
              </div>

              <div className="flex items-center text-2xl font-bold text-green-600">
                ${space.rent_amount}/month
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  space.furnished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {space.furnished ? "Furnished" : "Unfurnished"}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  space.utilities_included ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {space.utilities_included ? "Utilities Included" : "Utilities Separate"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                  {space.space_type}
                </span>
              </div>

              {space.rooms && space.rooms.length > 0 && (
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{space.rooms.length} room{space.rooms.length !== 1 ? 's' : ''} available</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleContactOwner} className="w-full" size="lg">
                Contact Owner
              </Button>
              <p className="text-sm text-gray-500 text-center mt-2">
                Connect to get more details and apply
              </p>
            </CardContent>
          </Card>

          {/* Amenities */}
          {space.amenities && space.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {space.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      {getAmenityIcon(amenity)}
                      <span className="ml-2 text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Description */}
      {space.description && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About this space</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-line">{space.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Available Rooms */}
      {space.rooms && space.rooms.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Available Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {space.rooms.map((room) => (
                <div key={room.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{room.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-600">${room.rent_amount}/month</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      room.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {room.is_available ? "Available" : "Occupied"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* House Rules */}
      {space.house_rules && space.house_rules.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>House Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {space.house_rules.map((rule, index) => (
                <div key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-sm">{rule.rule}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}