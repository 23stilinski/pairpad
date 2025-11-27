'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
import { auth } from '@/lib/api'
import type { User } from '@/lib/utils'

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Basic Account Info
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    role: 'student' as User['role'],

    // Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',

    // Location & Living Preferences
    currentCity: '',
    preferredCity: '',
    budgetMin: '',
    budgetMax: '',
    moveInDate: '',
    leaseDuration: '',

    // Additional Info
    bio: '',
    occupation: '',
    education: '',
    interests: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showPassword, setShowPassword] = useState(false)

  const login = useAuthStore((state) => state.login)

  const handleShowPassword = () => {
    setShowPassword(!showPassword)
  }

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter key from submitting form on steps 1-2
    if (e.key === 'Enter' && currentStep !== 3) {
      e.preventDefault()
      console.log('Enter pressed on step', currentStep, '- preventing submission')
      handleNext()
    }
  }

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {}

    if (step === 1) {
      if (!formData.email) newErrors.email = 'Email is required'
      if (!formData.username) newErrors.username = 'Username is required'
      if (!formData.password) newErrors.password = 'Password is required'
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    if (step === 2) {
      if (!formData.firstName) newErrors.firstName = 'First name is required'
      if (!formData.lastName) newErrors.lastName = 'Last name is required'
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
      if (!formData.gender) newErrors.gender = 'Gender is required'
    }

    if (step === 3) {
      if (!formData.currentCity) newErrors.currentCity = 'Current city is required'
      if (!formData.preferredCity) newErrors.preferredCity = 'Preferred city is required'
      if (!formData.budgetMin) newErrors.budgetMin = 'Minimum budget is required'
      if (!formData.budgetMax) newErrors.budgetMax = 'Maximum budget is required'
      if (parseInt(formData.budgetMin) >= parseInt(formData.budgetMax)) {
        newErrors.budgetMax = 'Maximum budget must be greater than minimum'
      }
    }

    return newErrors
  }

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    console.log('handleNext called, current step:', currentStep)

    const stepErrors = validateStep(currentStep)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Form submitted, current step:', currentStep)

    // Prevent submission if not on the final step
    if (currentStep !== 3) {
      console.log('Not on final step, preventing submission!')
      // Don't call handleNext here, just prevent submission
      return
    }

    console.log('On final step, validating all steps...')

    const allErrors = {
      ...validateStep(1),
      ...validateStep(2),
      ...validateStep(3)
    }

    console.log('Validation errors:', allErrors)

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      toast.error('Please fix the errors before submitting')
      return
    }

    console.log('No validation errors, proceeding with registration...')
    setIsLoading(true)
    setErrors({})

    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        role: formData.role,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        phone_number: formData.phoneNumber,
        current_city: formData.currentCity,
        preferred_city: formData.preferredCity,
        budget_min: parseInt(formData.budgetMin),
        budget_max: parseInt(formData.budgetMax),
        move_in_date: formData.moveInDate,
        lease_duration: formData.leaseDuration,
        bio: formData.bio,
        occupation: formData.occupation,
        education: formData.education,
        interests: formData.interests,
      }

      console.log('Sending registration data to API...')
      const { user } = await auth.register(registrationData)
      console.log('Registration successful, user:', user)

      login(user)
      toast.success(`Welcome to PairPad, ${user.username}!`)

      console.log('Redirecting to personality assessment...')
      window.location.href = '/personality/assessment'
    } catch (err: any) {
      let errorMessage = 'Registration failed. Please try again.'

      if (err.response?.data) {
        const errorData = err.response.data

        // Handle non_field_errors (array format)
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors.join(', ')
        }
        // Handle detail (string format)
        else if (errorData.detail) {
          errorMessage = errorData.detail
        }
        // Handle error (string format)
        else if (errorData.error) {
          errorMessage = errorData.error
        }
        // Handle field-specific errors (object format)
        else if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0]
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0]
          } else if (typeof firstError === 'string') {
            errorMessage = firstError
          }
        }
      }

      setErrors({ general: errorMessage })
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              step === currentStep
                ? 'bg-[#5d41ab] text-white'
                : step < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {step < currentStep ? '✓' : step}
            </div>
            {step < 3 && (
              <div className={`w-12 h-1 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#484848] mb-2">Account Information</h2>
        <p className="text-gray-600">Create your PairPad account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>
      </div>

      <div>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
        >
          <option value="student">Student</option>
          <option value="professional">Young Professional</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all pr-16"
          />
          <button
            type="button"
            onClick={handleShowPassword}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9ca299] hover:text-[#5d41ab] transition-colors"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#484848] mb-2">Personal Information</h2>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
          {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
        </div>

        <div>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
        </div>
      </div>

      <div>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Phone Number (optional)"
          className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            placeholder="Occupation/Job Title"
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
        </div>

        <div>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={handleChange}
            placeholder="Education Level/School"
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#484848] mb-2">Location & Budget</h2>
        <p className="text-gray-600">Where are you looking to live?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            name="currentCity"
            value={formData.currentCity}
            onChange={handleChange}
            placeholder="Current City"
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
          {errors.currentCity && <p className="text-red-500 text-sm mt-1">{errors.currentCity}</p>}
        </div>

        <div>
          <input
            type="text"
            name="preferredCity"
            value={formData.preferredCity}
            onChange={handleChange}
            placeholder="Preferred City for Living"
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
          {errors.preferredCity && <p className="text-red-500 text-sm mt-1">{errors.preferredCity}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="number"
            name="budgetMin"
            value={formData.budgetMin}
            onChange={handleChange}
            placeholder="Min Budget ($/month)"
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
          {errors.budgetMin && <p className="text-red-500 text-sm mt-1">{errors.budgetMin}</p>}
        </div>

        <div>
          <input
            type="number"
            name="budgetMax"
            value={formData.budgetMax}
            onChange={handleChange}
            placeholder="Max Budget ($/month)"
            required
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] placeholder-[#9ca299] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
          {errors.budgetMax && <p className="text-red-500 text-sm mt-1">{errors.budgetMax}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="date"
            name="moveInDate"
            value={formData.moveInDate}
            onChange={handleChange}
            placeholder="Preferred Move-in Date"
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          />
        </div>

        <div>
          <select
            name="leaseDuration"
            value={formData.leaseDuration}
            onChange={handleChange}
            className="w-full px-6 py-4 border border-gray-200 rounded-2xl text-[#484848] focus:outline-none focus:ring-2 focus:ring-[#5d41ab] focus:border-transparent transition-all"
          >
            <option value="">Lease Duration</option>
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

  return (
    <div className="min-h-screen bg-white font-['DynaPuff',Helvetica,Arial,sans-serif]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-[#5d41ab] text-2xl font-bold">
              PairPad
            </Link>
            <div className="flex gap-4">
              <Link href="/login">
                <button className="text-[#484848] font-medium hover:text-[#5d41ab] transition-colors">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="min-h-[80vh]">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#484848] mb-4">
              Join the
              <span className="text-[#5d41ab] block">PairPad community</span>
            </h1>
            <p className="text-xl text-[#484848] font-light">
              Create your detailed profile to find your perfect roommate match
            </p>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
                  <p className="text-red-600 text-sm text-center">{errors.general}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      console.log('Next button clicked!')
                      handleNext(e)
                    }}
                    className="px-8 py-3 bg-[#5d41ab] text-white rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    onClick={(e) => {
                      console.log('Create Account button clicked!')
                      // Let the form's onSubmit handler take over
                    }}
                    className="px-8 py-3 bg-[#5d41ab] text-white rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                )}
              </div>
            </form>

            <div className="text-center mt-6">
              <Link href="/login" className="text-[#9ca299] hover:text-[#5d41ab] transition-colors">
                Already have an account? <span className="font-medium">Sign in</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}