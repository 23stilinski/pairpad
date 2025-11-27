'use client'

import { useState } from 'react'
import { sharedDashboard } from '@/lib/api'
import toast from 'react-hot-toast'

interface Bill {
  id: number
  title: string
  description: string
  amount: string
  due_date: string
  recurrence: string
  status: string
  paid_by: string | null
  paid_at: string | null
  created_by: string
}

interface BillsSectionProps {
  bills: Bill[]
  livingSpaceId: number
  onUpdate: () => void
}

export default function BillsSection({ bills, livingSpaceId, onUpdate }: BillsSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBill, setNewBill] = useState({
    title: '',
    description: '',
    amount: '',
    due_date: '',
    recurrence: 'none',
  })
  const [loading, setLoading] = useState(false)
  const [markingPaid, setMarkingPaid] = useState<number | null>(null)

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await sharedDashboard.createBill(livingSpaceId, {
        ...newBill,
        amount: parseFloat(newBill.amount),
      })
      toast.success('Bill created successfully!')
      setShowAddModal(false)
      setNewBill({
        title: '',
        description: '',
        amount: '',
        due_date: '',
        recurrence: 'none',
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to create bill:', error)
      toast.error('Failed to create bill')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (billId: number) => {
    try {
      setMarkingPaid(billId)
      await sharedDashboard.markBillPaid(billId)
      toast.success('Bill marked as paid!')
      onUpdate()
    } catch (error) {
      console.error('Failed to mark bill as paid:', error)
      toast.error('Failed to mark bill as paid')
    } finally {
      setMarkingPaid(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-orange-100 text-orange-800'
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const pendingBills = bills.filter(b => b.status !== 'paid')
  const totalPending = pendingBills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0)

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#484848]">Bills</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#5d41ab] text-white px-3 py-2 rounded-2xl text-sm font-medium hover:bg-[#4c2d87] transition-all"
        >
          + Add
        </button>
      </div>

      {/* Summary */}
      {pendingBills.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-2xl p-4 mb-4">
          <div className="text-sm text-gray-600 mb-1">Total Pending</div>
          <div className="text-2xl font-bold text-orange-600">${totalPending.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{pendingBills.length} bill(s)</div>
        </div>
      )}

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-sm text-gray-500">No bills yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => {
            const daysUntilDue = getDaysUntilDue(bill.due_date)
            const isOverdue = daysUntilDue < 0 && bill.status !== 'paid'

            return (
              <div
                key={bill.id}
                className={`border-2 rounded-2xl p-4 transition-all ${
                  isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-100 hover:border-[#5d41ab]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-[#484848] text-sm mb-1">{bill.title}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(bill.status)} capitalize`}>
                        {bill.status}
                      </span>
                      {bill.recurrence !== 'none' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 capitalize">
                          {bill.recurrence}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#5d41ab]">${parseFloat(bill.amount).toFixed(2)}</div>
                  </div>
                </div>

                {bill.description && (
                  <p className="text-xs text-gray-600 mb-2">{bill.description}</p>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className={`${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    Due: {new Date(bill.due_date).toLocaleDateString()}
                    {daysUntilDue >= 0 && bill.status !== 'paid' && (
                      <span className="ml-1">({daysUntilDue} days)</span>
                    )}
                  </span>
                  {bill.status !== 'paid' && (
                    <button
                      onClick={() => handleMarkPaid(bill.id)}
                      disabled={markingPaid === bill.id}
                      className="bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-all disabled:opacity-50"
                    >
                      {markingPaid === bill.id ? '...' : 'Mark Paid'}
                    </button>
                  )}
                  {bill.status === 'paid' && bill.paid_by && (
                    <span className="text-green-600">
                      ✓ Paid by {bill.paid_by}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-[#484848] mb-6">Add New Bill</h3>
            <form onSubmit={handleAddBill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Title</label>
                <input
                  type="text"
                  value={newBill.title}
                  onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="e.g., Electricity Bill"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Due Date</label>
                <input
                  type="date"
                  value={newBill.due_date}
                  onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Recurrence</label>
                <select
                  value={newBill.recurrence}
                  onChange={(e) => setNewBill({ ...newBill, recurrence: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                >
                  <option value="none">One-time</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Description</label>
                <textarea
                  value={newBill.description}
                  onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  rows={2}
                  placeholder="Optional details..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Bill'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-[#484848] py-3 rounded-2xl font-medium hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
