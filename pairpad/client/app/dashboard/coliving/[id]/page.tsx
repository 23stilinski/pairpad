'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'
import { coliving, matching } from '@/lib/api'

// Component imports
import ImageGallery from '@/components/coliving/ImageGallery'
import SpaceDetails from '@/components/coliving/SpaceDetails'
import HouseRules from '@/components/coliving/HouseRules'
import HostProfile from '@/components/coliving/HostProfile'
import RoomsSection from '@/components/coliving/RoomsSection'
import SpaceSidebar from '@/components/coliving/SpaceSidebar'
import BookingModal from '@/components/coliving/BookingModal'

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
  images: any[]
  rooms: Room[]
  house_rules: any
  members: any[]
  average_rating: number | null
  available_rooms_count: number
  created_at: string
  created_by: any
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

export default function LivingSpaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const spaceId = params.id as string

  const [space, setSpace] = useState<LivingSpace | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showImageManager, setShowImageManager] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showMatchRequest, setShowMatchRequest] = useState(false)
  const [requestingMatch, setRequestingMatch] = useState(false)

  const [editData, setEditData] = useState<Partial<LivingSpace>>({})
  const [newRoom, setNewRoom] = useState({
    name: '',
    room_type: 'bedroom' as Room['room_type'],
    description: '',
    size_sqft: '',
    has_private_bathroom: false,
    has_balcony: false,
    has_closet: true,
    furnished: false,
    air_conditioning: false,
    is_available: true,
    monthly_rent: '',
    security_deposit: '',
    available_from: '',
  })

  useEffect(() => {
    if (spaceId) {
      fetchLivingSpace()
    }
  }, [spaceId])

  const fetchLivingSpace = async () => {
    try {
      const data = await coliving.getLivingSpace(spaceId)
      setSpace(data)
      setEditData(data)
    } catch (error) {
      console.error('Failed to fetch living space:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSpace = async () => {
    try {
      const updated = await coliving.updateLivingSpace(spaceId, editData)
      setSpace(updated)
      setEditMode(false)
    } catch (error) {
      console.error('Failed to update living space:', error)
    }
  }

  const addRoom = async () => {
    try {
      const roomData = {
        ...newRoom,
        living_space: spaceId,
        size_sqft: newRoom.size_sqft ? parseInt(newRoom.size_sqft) : null,
        monthly_rent: newRoom.monthly_rent ? parseFloat(newRoom.monthly_rent) : null,
        security_deposit: newRoom.security_deposit ? parseFloat(newRoom.security_deposit) : null,
      }
      const created = await coliving.createRoom(roomData)
      if (space) {
        setSpace({ ...space, rooms: [...space.rooms, created] })
      }
      setShowAddRoom(false)
      setNewRoom({
        name: '',
        room_type: 'bedroom',
        description: '',
        size_sqft: '',
        has_private_bathroom: false,
        has_balcony: false,
        has_closet: true,
        furnished: false,
        air_conditioning: false,
        is_available: true,
        monthly_rent: '',
        security_deposit: '',
        available_from: '',
      })
    } catch (error) {
      console.error('Failed to add room:', error)
    }
  }

  const openImageGallery = (startIndex: number = 0) => {
    setCurrentImageIndex(startIndex)
    setShowImageGallery(true)
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

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !space) return

    setUploadingImage(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('image', file)
        formData.append('living_space', spaceId)
        formData.append('image_type', 'other')
        formData.append('is_primary', space.images.length === 0 ? 'true' : 'false')

        const newImage = await coliving.uploadImage(spaceId, formData)
        setSpace(prev => prev ? {
          ...prev,
          images: [...prev.images, newImage]
        } : null)
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  const deleteImage = async (imageId: string) => {
    try {
      await coliving.deleteImage(imageId)
      setSpace(prev => prev ? {
        ...prev,
        images: prev.images.filter(img => img.id !== imageId)
      } : null)
    } catch (error) {
      console.error('Failed to delete image:', error)
    }
  }

  const setPrimaryImage = async (imageId: string) => {
    try {
      // First, unset all primary images
      const updates = space?.images.map(async (img) => {
        if (img.is_primary && img.id !== imageId) {
          await coliving.updateImage(img.id, { is_primary: false })
        }
      })

      if (updates) {
        await Promise.all(updates)
      }

      // Set the new primary image
      await coliving.updateImage(imageId, { is_primary: true })

      // Update local state
      setSpace(prev => prev ? {
        ...prev,
        images: prev.images.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }))
      } : null)
    } catch (error) {
      console.error('Failed to set primary image:', error)
    }
  }

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room)
    setShowBookingModal(true)
  }

  const handleRequestMatch = async () => {
    if (!space?.created_by?.id) return

    setRequestingMatch(true)
    try {
      await matching.requestMatch(space.created_by.id)
      setShowMatchRequest(true)
    } catch (error) {
      console.error('Failed to request match:', error)
      alert('Failed to send match request')
    } finally {
      setRequestingMatch(false)
    }
  }

  const submitBooking = async (bookingData: any) => {
    if (!selectedRoom) return

    try {
      await coliving.bookRoom(selectedRoom.id, bookingData)
      alert('Booking request submitted successfully!')
      setShowBookingModal(false)
      fetchLivingSpace() // Refresh data
    } catch (error) {
      console.error('Failed to submit booking:', error)
      alert('Failed to submit booking request')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#5d41ab] mx-auto mb-4"></div>
          <p className="text-[#484848] text-xl">Loading space details...</p>
        </div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif] flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Space Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">This living space doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/dashboard/coliving')}>
              Back to Living Spaces
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = user?.id === space.created_by?.id || space.members?.some(m => m.user_id === user?.id && m.role === 'admin')

  return (
    <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
      {/* Image Gallery Modal */}
      {showImageGallery && space.images && space.images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="max-w-7xl mx-auto px-4 py-8 w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 text-white">
              <div>
                <h2 className="text-2xl font-bold">{space.name}</h2>
                <p className="text-gray-300">
                  {currentImageIndex + 1} of {space.images.length}
                </p>
              </div>
              <button
                onClick={() => setShowImageGallery(false)}
                className="text-white hover:text-gray-300 text-3xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 relative">
              <img
                src={space.images[currentImageIndex]?.image}
                alt={`${space.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain rounded-lg"
              />

              {space.images.length > 1 && (
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
            </div>

            {space.images.length > 1 && (
              <div className="mt-6 flex gap-2 justify-center overflow-x-auto pb-4">
                {space.images.map((image, index) => (
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
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/coliving')}
            className="text-[#5d41ab] hover:text-[#4c2d87] font-medium mb-4"
          >
            ← Back to Living Spaces
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-[#484848] mb-2">
                {space.name}
              </h1>
              <p className="text-xl text-gray-600 capitalize mb-2">
                {space.space_type} • {space.city}, {space.state}
              </p>
              <p className="text-gray-500">{space.address}</p>
            </div>

            {isOwner && (
              <div className="flex gap-3">
                <Button
                  onClick={() => setEditMode(!editMode)}
                  variant={editMode ? "secondary" : "outline"}
                >
                  {editMode ? 'Cancel Edit' : 'Edit Space'}
                </Button>
                {editMode && (
                  <Button
                    onClick={updateSpace}
                    className="bg-[#5d41ab] hover:bg-[#4c2d87]"
                  >
                    Save Changes
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <ImageGallery
              images={space.images}
              spaceName={space.name}
              isOwner={isOwner}
              onImageManager={() => setShowImageManager(true)}
              onImageGallery={openImageGallery}
            />

            <SpaceDetails
              space={space}
              editMode={editMode}
              editData={editData}
              onEditData={setEditData}
            />

            <HouseRules
              houseRules={space.house_rules}
              isOwner={isOwner}
            />

            <RoomsSection
              rooms={space.rooms}
              availableRoomsCount={space.available_rooms_count}
              isOwner={isOwner}
              onAddRoom={() => setShowAddRoom(true)}
              onBookRoom={handleBookRoom}
            />
          </div>

          {/* Right Sidebar */}
          <div>
            <SpaceSidebar
              totalRent={space.total_rent}
              rooms={space.rooms}
              utilitiesIncluded={space.utilities_included}
              totalRooms={space.rooms.length}
              availableRooms={space.available_rooms_count}
              occupiedRooms={space.rooms.length - space.available_rooms_count}
              membersCount={space.members?.length || 0}
              averageRating={space.average_rating}
              isOwner={isOwner}
              requestingMatch={requestingMatch}
              onRequestMatch={handleRequestMatch}
              onAddRoom={() => setShowAddRoom(true)}
              onImageManager={() => setShowImageManager(true)}
            />

            <HostProfile
              host={space.created_by}
            />
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <BookingModal
          room={selectedRoom}
          onSubmit={submitBooking}
          onCancel={() => setShowBookingModal(false)}
        />
      )}

      {/* Match Request Success Modal */}
      {showMatchRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-500 text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-[#484848] mb-4">Match Request Sent!</h2>
            <p className="text-gray-600 mb-6">
              Your match request has been sent to the space owner. They'll be notified and can respond to your request.
            </p>
            <Button
              onClick={() => setShowMatchRequest(false)}
              className="bg-[#5d41ab] hover:bg-[#4c2d87] text-white px-8 py-3 rounded-2xl"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}

      {/* Add Room Modal - keeping inline for now as it's complex */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-[#484848] mb-6">Add New Room</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Room Name</label>
                <Input
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="e.g., Master Bedroom"
                  className="rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Room Type</label>
                <select
                  value={newRoom.room_type}
                  onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                >
                  <option value="bedroom">Bedroom</option>
                  <option value="shared_bedroom">Shared Bedroom</option>
                  <option value="studio">Studio</option>
                  <option value="master_bedroom">Master Bedroom</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#484848] mb-2">Description</label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="Describe the room..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Size (sq ft)</label>
                <Input
                  type="number"
                  value={newRoom.size_sqft}
                  onChange={(e) => setNewRoom({ ...newRoom, size_sqft: e.target.value })}
                  placeholder="e.g., 120"
                  className="rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Monthly Rent ($)</label>
                <Input
                  type="number"
                  value={newRoom.monthly_rent}
                  onChange={(e) => setNewRoom({ ...newRoom, monthly_rent: e.target.value })}
                  placeholder="e.g., 800"
                  className="rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Security Deposit ($)</label>
                <Input
                  type="number"
                  value={newRoom.security_deposit}
                  onChange={(e) => setNewRoom({ ...newRoom, security_deposit: e.target.value })}
                  placeholder="e.g., 800"
                  className="rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Available From</label>
                <Input
                  type="date"
                  value={newRoom.available_from}
                  onChange={(e) => setNewRoom({ ...newRoom, available_from: e.target.value })}
                  className="rounded-2xl"
                />
              </div>

              <div className="md:col-span-2">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newRoom.has_private_bathroom}
                        onChange={(e) => setNewRoom({ ...newRoom, has_private_bathroom: e.target.checked })}
                        className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                      />
                      <label className="ml-2 text-sm text-[#484848]">Private Bathroom</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newRoom.has_balcony}
                        onChange={(e) => setNewRoom({ ...newRoom, has_balcony: e.target.checked })}
                        className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                      />
                      <label className="ml-2 text-sm text-[#484848]">Balcony</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newRoom.has_closet}
                        onChange={(e) => setNewRoom({ ...newRoom, has_closet: e.target.checked })}
                        className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                      />
                      <label className="ml-2 text-sm text-[#484848]">Closet</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newRoom.furnished}
                        onChange={(e) => setNewRoom({ ...newRoom, furnished: e.target.checked })}
                        className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                      />
                      <label className="ml-2 text-sm text-[#484848]">Furnished</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newRoom.air_conditioning}
                        onChange={(e) => setNewRoom({ ...newRoom, air_conditioning: e.target.checked })}
                        className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                      />
                      <label className="ml-2 text-sm text-[#484848]">Air Conditioning</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newRoom.is_available}
                        onChange={(e) => setNewRoom({ ...newRoom, is_available: e.target.checked })}
                        className="rounded text-[#5d41ab] focus:ring-[#5d41ab]"
                      />
                      <label className="ml-2 text-sm text-[#484848]">Available for Rent</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                onClick={addRoom}
                className="bg-[#5d41ab] hover:bg-[#4c2d87] text-white px-8 py-3 rounded-2xl font-medium"
              >
                Add Room
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddRoom(false)}
                className="px-8 py-3 rounded-2xl font-medium"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Manager Modal - keeping inline for now as it's complex */}
      {showImageManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-[#484848] mb-6">Manage Space Images</h2>

            {/* Upload Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-[#484848] mb-4">Add New Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImage}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-gray-600">
                    {uploadingImage ? 'Uploading...' : 'Click to upload images or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-400">PNG, JPG up to 10MB each</p>
                </label>
              </div>
            </div>

            {/* Current Images */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#484848] mb-4">Current Images ({space?.images?.length || 0})</h3>

              {space?.images && space.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {space.images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.image}
                        alt={`Space image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />

                      {/* Primary badge */}
                      {image.is_primary && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Primary
                        </div>
                      )}

                      {/* Actions overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          {!image.is_primary && (
                            <Button
                              onClick={() => setPrimaryImage(image.id)}
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              Set Primary
                            </Button>
                          )}
                          <Button
                            onClick={() => deleteImage(image.id)}
                            size="sm"
                            variant="destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Image details */}
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 capitalize">
                          {image.image_type || 'general'}
                        </p>
                        {image.caption && (
                          <p className="text-xs text-gray-500 truncate">{image.caption}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No images uploaded yet</p>
                  <p className="text-sm">Upload your first image above</p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">💡 Image Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Upload high-quality photos to attract more applicants</li>
                <li>• Set a primary image that best represents your space</li>
                <li>• Include photos of common areas, bedrooms, and amenities</li>
                <li>• Good lighting makes photos more appealing</li>
                <li>• Show the space at its cleanest and most organized</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setShowImageManager(false)}
                className="px-8 py-3 rounded-2xl font-medium"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}