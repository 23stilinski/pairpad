'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Room {
  id: string
  name: string
  description: string
  size_sqft: number | null
  monthly_rent: number | null
}

interface BookingModalProps {
  room: Room
  onSubmit: (data: any) => void
  onCancel: () => void
}

export default function BookingModal({ room, onSubmit, onCancel }: BookingModalProps) {
  const [formData, setFormData] = useState({
    move_in_date: '',
    lease_duration: '12',
    message: '',
    contact_phone: '',
    contact_email: '',
    employment_status: 'employed',
    monthly_income: '',
    references: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-[#484848] mb-6">Book {room.name}</h2>

        <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
          <h3 className="font-semibold text-[#484848] mb-2">{room.name}</h3>
          <p className="text-gray-600 mb-2">{room.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{room.size_sqft} sq ft</span>
            <span className="font-bold text-[#5d41ab] text-xl">${room.monthly_rent}/month</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#484848] mb-2">Move-in Date</label>
              <Input
                type="date"
                value={formData.move_in_date}
                onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                required
                className="rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#484848] mb-2">Lease Duration (months)</label>
              <select
                value={formData.lease_duration}
                onChange={(e) => setFormData({ ...formData, lease_duration: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#484848] mb-2">Email</label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                required
                className="rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#484848] mb-2">Phone</label>
              <Input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#484848] mb-2">Employment Status</label>
              <select
                value={formData.employment_status}
                onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              >
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="student">Student</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#484848] mb-2">Monthly Income ($)</label>
              <Input
                type="number"
                value={formData.monthly_income}
                onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#484848] mb-2">Message to Host</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell the host why you'd be a great roommate..."
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#484848] mb-2">References (optional)</label>
            <textarea
              value={formData.references}
              onChange={(e) => setFormData({ ...formData, references: e.target.value })}
              placeholder="Previous landlords, employers, or personal references..."
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              rows={3}
            />
          </div>

          <div className="flex gap-4 mt-8">
            <Button
              type="submit"
              className="bg-[#5d41ab] hover:bg-[#4c2d87] text-white px-8 py-3 rounded-2xl font-medium"
            >
              Submit Booking Request
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-8 py-3 rounded-2xl font-medium"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}