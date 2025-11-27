'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { auth } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, User, MapPin, Home, Heart, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'location' | 'lifestyle' | 'profile'>('personal')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone_number: '',
    occupation: '',
    education: '',

    // Location & Housing Preferences
    current_city: '',
    preferred_city: '',
    budget_min: '',
    budget_max: '',
    move_in_date: '',
    lease_duration: '',

    // Lifestyle Preferences
    smoking_preference: 'no_preference',
    pets_preference: 'no_preference',
    guests_preference: 'occasionally',
    cleanliness_level: '50',
    social_level: '50',
    quiet_hours: false,

    // Profile Information
    bio: '',
    interests: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        phone_number: user.phone_number || '',
        occupation: user.occupation || '',
        education: user.education || '',
        current_city: user.current_city || '',
        preferred_city: user.preferred_city || '',
        budget_min: user.budget_min?.toString() || '',
        budget_max: user.budget_max?.toString() || '',
        move_in_date: user.move_in_date || '',
        lease_duration: user.lease_duration || '',
        smoking_preference: user.smoking_preference || 'no_preference',
        pets_preference: user.pets_preference || 'no_preference',
        guests_preference: user.guests_preference || 'occasionally',
        cleanliness_level: user.cleanliness_level?.toString() || '50',
        social_level: user.social_level?.toString() || '50',
        quiet_hours: user.quiet_hours || false,
        bio: user.bio || '',
        interests: user.interests || '',
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (formData.budget_min && formData.budget_max) {
      if (parseInt(formData.budget_min) >= parseInt(formData.budget_max)) {
        newErrors.budget_max = 'Maximum budget must be greater than minimum'
      }
    }

    if (formData.date_of_birth) {
      const today = new Date()
      const birthDate = new Date(formData.date_of_birth)
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 18) {
        newErrors.date_of_birth = 'You must be at least 18 years old'
      }
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('Please fix the errors before saving')
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
        phone_number: formData.phone_number,
        occupation: formData.occupation,
        education: formData.education,
        current_city: formData.current_city,
        preferred_city: formData.preferred_city,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
        move_in_date: formData.move_in_date || null,
        lease_duration: formData.lease_duration,
        smoking_preference: formData.smoking_preference,
        pets_preference: formData.pets_preference,
        guests_preference: formData.guests_preference,
        cleanliness_level: parseInt(formData.cleanliness_level),
        social_level: parseInt(formData.social_level),
        quiet_hours: formData.quiet_hours,
        bio: formData.bio,
        interests: formData.interests,
      }

      // Call API to update profile
      const response = await auth.updateProfile(updateData)
      updateUser(response)

      toast.success('Profile updated successfully!')

      // Optionally redirect back to dashboard
      // router.push('/dashboard')
    } catch (err: any) {
      console.error('Profile update error:', err)
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Failed to update profile'
      setErrors({ general: errorMessage })
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#484848] mb-4">Personal Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">First Name</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Last Name</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          />
          {errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#484848] mb-2">Phone Number</label>
        <input
          type="tel"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="(optional)"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Occupation</label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Education</label>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )

  const renderLocationInfo = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#484848] mb-4">Location & Budget</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Current City</label>
          <input
            type="text"
            name="current_city"
            value={formData.current_city}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Preferred City</label>
          <input
            type="text"
            name="preferred_city"
            value={formData.preferred_city}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Min Budget ($/month)</label>
          <input
            type="number"
            name="budget_min"
            value={formData.budget_min}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Max Budget ($/month)</label>
          <input
            type="number"
            name="budget_max"
            value={formData.budget_max}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          />
          {errors.budget_max && <p className="text-red-500 text-sm mt-1">{errors.budget_max}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Move-in Date</label>
          <input
            type="date"
            name="move_in_date"
            value={formData.move_in_date}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Lease Duration</label>
          <select
            name="lease_duration"
            value={formData.lease_duration}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          >
            <option value="">Select Duration</option>
            <option value="3_months">3 months</option>
            <option value="6_months">6 months</option>
            <option value="12_months">12 months</option>
            <option value="18_months">18 months</option>
            <option value="24_months">24+ months</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderLifestyleInfo = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#484848] mb-4">Lifestyle Preferences</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Smoking Preference</label>
          <select
            name="smoking_preference"
            value={formData.smoking_preference}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          >
            <option value="no_preference">No Preference</option>
            <option value="smoker">I smoke</option>
            <option value="non_smoker">Non-smoker only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">Pets Preference</label>
          <select
            name="pets_preference"
            value={formData.pets_preference}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
          >
            <option value="no_preference">No Preference</option>
            <option value="has_pets">I have pets</option>
            <option value="no_pets">No pets</option>
            <option value="loves_pets">Love pets but don't have any</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#484848] mb-2">Guest Policy</label>
        <select
          name="guests_preference"
          value={formData.guests_preference}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
        >
          <option value="rarely">Rarely have guests</option>
          <option value="occasionally">Occasionally have guests</option>
          <option value="frequently">Frequently have guests</option>
          <option value="no_guests">No overnight guests</option>
        </select>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">
            Cleanliness Level: {formData.cleanliness_level}%
          </label>
          <input
            type="range"
            name="cleanliness_level"
            min="0"
            max="100"
            value={formData.cleanliness_level}
            onChange={handleChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Messy</span>
            <span>Very Clean</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#484848] mb-2">
            Social Level: {formData.social_level}%
          </label>
          <input
            type="range"
            name="social_level"
            min="0"
            max="100"
            value={formData.social_level}
            onChange={handleChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Prefer Privacy</span>
            <span>Love Socializing</span>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="quiet_hours"
          checked={formData.quiet_hours}
          onChange={handleChange}
          className="mr-3 h-4 w-4 text-[#5d41ab] focus:ring-[#5d41ab] border-gray-300 rounded"
        />
        <label className="text-[#484848]">I prefer quiet hours (10 PM - 8 AM)</label>
      </div>
    </div>
  )

  const renderProfileInfo = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#484848] mb-4">Profile Information</h3>

      <div>
        <label className="block text-sm font-medium text-[#484848] mb-2">About Me</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell potential roommates about yourself, your lifestyle, and what you're looking for..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#484848] mb-2">Interests & Hobbies</label>
        <textarea
          name="interests"
          value={formData.interests}
          onChange={handleChange}
          placeholder="Tell us about your interests, hobbies, and what you like to do in your free time..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent"
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="inline-flex items-center text-[#5d41ab] hover:text-[#4c2d87]">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            {user && (
              <Link href={`/profile/${user.id}`}>
                <button className="bg-white border-2 border-[#5d41ab] text-[#5d41ab] px-6 py-2 rounded-xl font-medium hover:bg-[#5d41ab] hover:text-white transition-all">
                  View Public Profile
                </button>
              </Link>
            )}
          </div>
          <h1 className="text-4xl font-bold text-[#484848] mb-2">Edit Profile</h1>
          <p className="text-gray-600">Update your information to improve your roommate matches</p>
        </div>

        {/* User Info Card */}
        <div className="bg-gradient-to-r from-[#5d41ab] to-[#7c5fbb] rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#5d41ab] text-2xl font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.username}</h2>
              <p className="text-white/80">{user?.email}</p>
              <p className="text-sm text-white/60 capitalize">Role: {user?.role}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'personal'
                ? 'bg-[#5d41ab] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            Personal
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'location'
                ? 'bg-[#5d41ab] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Location
          </button>
          <button
            onClick={() => setActiveTab('lifestyle')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'lifestyle'
                ? 'bg-[#5d41ab] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Home className="w-4 h-4" />
            Lifestyle
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-[#5d41ab] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            Profile
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 mb-6">
            {activeTab === 'personal' && renderPersonalInfo()}
            {activeTab === 'location' && renderLocationInfo()}
            {activeTab === 'lifestyle' && renderLifestyleInfo()}
            {activeTab === 'profile' && renderProfileInfo()}

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-3 bg-[#5d41ab] text-white rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
