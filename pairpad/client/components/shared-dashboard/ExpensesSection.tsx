'use client'

import { useState } from 'react'
import { sharedDashboard } from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'

interface Expense {
  id: number
  title: string
  description: string
  category: string
  amount: string
  paid_by: string
  split_type: string
  expense_date: string
  created_at: string
  participants?: Array<{ id: number; username: string }>
  splits?: Array<{
    user_id: number
    username: string
    amount_owed: string
    amount_paid: string
    is_settled: boolean
  }>
}

interface ExpensesSectionProps {
  expenses: Expense[]
  livingSpaceId: number
  otherUser: any
  onUpdate: () => void
  members?: any[]
}

export default function ExpensesSection({ expenses, livingSpaceId, otherUser, onUpdate, members = [] }: ExpensesSectionProps) {
  const { user } = useAuthStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [newExpense, setNewExpense] = useState({
    title: '',
    description: '',
    category: 'groceries',
    amount: '',
    split_type: 'equal',
    expense_date: new Date().toISOString().slice(0, 16),
  })
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [memberPercentages, setMemberPercentages] = useState<Record<number, number>>({})
  const [memberAmounts, setMemberAmounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member to split with')
      return
    }

    // Validate percentages if percentage split
    if (newExpense.split_type === 'percentage') {
      const totalPercentage = Object.values(memberPercentages).reduce((sum, p) => sum + p, 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        toast.error('Percentages must add up to 100%')
        return
      }
    }

    // Validate custom amounts if custom split
    if (newExpense.split_type === 'custom') {
      const totalAmount = Object.values(memberAmounts).reduce((sum, a) => sum + a, 0)
      const expenseAmount = parseFloat(newExpense.amount)
      if (Math.abs(totalAmount - expenseAmount) > 0.01) {
        toast.error(`Custom amounts must add up to $${expenseAmount.toFixed(2)}`)
        return
      }
    }

    try {
      setLoading(true)
      const expenseData: any = {
        living_space: livingSpaceId,
        title: newExpense.title,
        description: newExpense.description,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        split_type: newExpense.split_type,
        expense_date: newExpense.expense_date,
        participant_ids: selectedMembers,
      }

      // Add percentages if using percentage split
      if (newExpense.split_type === 'percentage') {
        expenseData.participant_percentages = memberPercentages
      }

      // Add custom amounts if using custom split
      if (newExpense.split_type === 'custom') {
        expenseData.participant_amounts = memberAmounts
      }

      // paid_by defaults to current user in backend if not provided
      await sharedDashboard.createExpense(expenseData)
      toast.success('Expense added successfully!')
      setShowAddModal(false)
      setNewExpense({
        title: '',
        description: '',
        category: 'groceries',
        amount: '',
        split_type: 'equal',
        expense_date: new Date().toISOString().slice(0, 16),
      })
      setSelectedMembers([])
      setMemberPercentages({})
      setMemberAmounts({})
      onUpdate()
    } catch (error) {
      console.error('Failed to create expense:', error)
      toast.error('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  const toggleMember = (userId: number) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setNewExpense({
      title: expense.title,
      description: expense.description || '',
      category: expense.category,
      amount: expense.amount,
      split_type: expense.split_type,
      expense_date: new Date(expense.expense_date).toISOString().slice(0, 16),
    })

    // Set selected members and their percentages/amounts
    if (expense.participants) {
      setSelectedMembers(expense.participants.map(p => p.id))
    }

    if (expense.splits) {
      const percentages: Record<number, number> = {}
      const amounts: Record<number, number> = {}

      expense.splits.forEach(split => {
        amounts[split.user_id] = parseFloat(split.amount_owed)

        // Calculate percentage if percentage split
        if (expense.split_type === 'percentage') {
          percentages[split.user_id] = (parseFloat(split.amount_owed) / parseFloat(expense.amount)) * 100
        }
      })

      setMemberPercentages(percentages)
      setMemberAmounts(amounts)
    }

    setShowEditModal(true)
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingExpense) return

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member to split with')
      return
    }

    // Validate percentages if percentage split
    if (newExpense.split_type === 'percentage') {
      const totalPercentage = Object.values(memberPercentages).reduce((sum, p) => sum + p, 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        toast.error('Percentages must add up to 100%')
        return
      }
    }

    // Validate custom amounts if custom split
    if (newExpense.split_type === 'custom') {
      const totalAmount = Object.values(memberAmounts).reduce((sum, a) => sum + a, 0)
      const expenseAmount = parseFloat(newExpense.amount)
      if (Math.abs(totalAmount - expenseAmount) > 0.01) {
        toast.error(`Custom amounts must add up to $${expenseAmount.toFixed(2)}`)
        return
      }
    }

    try {
      setLoading(true)
      const expenseData: any = {
        living_space: livingSpaceId,
        title: newExpense.title,
        description: newExpense.description,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        split_type: newExpense.split_type,
        expense_date: newExpense.expense_date,
        participant_ids: selectedMembers,
      }

      // Add percentages if using percentage split
      if (newExpense.split_type === 'percentage') {
        expenseData.participant_percentages = memberPercentages
      }

      // Add custom amounts if using custom split
      if (newExpense.split_type === 'custom') {
        expenseData.participant_amounts = memberAmounts
      }

      await sharedDashboard.updateExpense(editingExpense.id, expenseData)
      toast.success('Expense updated successfully!')
      setShowEditModal(false)
      setEditingExpense(null)
      setNewExpense({
        title: '',
        description: '',
        category: 'groceries',
        amount: '',
        split_type: 'equal',
        expense_date: new Date().toISOString().slice(0, 16),
      })
      setSelectedMembers([])
      setMemberPercentages({})
      setMemberAmounts({})
      onUpdate()
    } catch (error) {
      console.error('Failed to update expense:', error)
      toast.error('Failed to update expense')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return
    }

    try {
      await sharedDashboard.deleteExpense(livingSpaceId, expenseId)
      toast.success('Expense deleted successfully')
      onUpdate()
    } catch (error) {
      console.error('Failed to delete expense:', error)
      toast.error('Failed to delete expense')
    }
  }

  const handleToggleExpenseSettlement = async (expenseId: number, userId: number, currentStatus: boolean) => {
    try {
      await sharedDashboard.settleExpenseSplit(expenseId, userId, !currentStatus)
      toast.success(currentStatus ? 'Marked as unpaid' : 'Marked as paid')
      onUpdate()
    } catch (error) {
      console.error('Failed to update settlement:', error)
      toast.error('Failed to update payment status')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rent': return '🏠'
      case 'utilities': return '💡'
      case 'groceries': return '🛒'
      case 'supplies': return '📦'
      case 'maintenance': return '🔧'
      case 'internet': return '🌐'
      default: return '💰'
    }
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
  const myExpenses = expenses.filter(exp => exp.paid_by === user?.username)
  const totalPaidByMe = myExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#484848]">Expenses</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#5d41ab] text-white px-4 py-2 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105"
        >
          + Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 rounded-2xl p-4">
          <div className="text-sm text-gray-700 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-[#5d41ab]">${totalExpenses.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 rounded-2xl p-4">
          <div className="text-sm text-gray-700 mb-1">I Paid</div>
          <div className="text-2xl font-bold text-blue-600">${totalPaidByMe.toFixed(2)}</div>
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <p className="text-gray-700">No expenses recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="border-2 border-gray-100 rounded-2xl p-4 hover:border-[#5d41ab] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getCategoryIcon(expense.category)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-[#484848]">{expense.title}</h4>
                      <p className="text-xs text-gray-600 capitalize">{expense.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#5d41ab]">${parseFloat(expense.amount).toFixed(2)}</div>
                      <div className="text-xs text-gray-600 capitalize">
                        {expense.split_type === 'equal' ? 'Split Equally' : expense.split_type}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        title="Edit expense"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete expense"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-gray-700 mb-2">{expense.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                    <span>Paid by: {expense.paid_by}</span>
                    <span>📅 {new Date(expense.expense_date).toLocaleDateString()}</span>
                  </div>

                  {/* Show splits if available */}
                  {expense.splits && expense.splits.length > 0 ? (
                    <div className="mt-2 bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-bold text-[#484848] mb-2">Split between:</p>
                      {expense.splits.map((split) => (
                        <div key={split.user_id} className="flex items-center justify-between text-sm gap-3">
                          <label className="flex items-center gap-2 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={split.is_settled}
                              onChange={() => handleToggleExpenseSettlement(expense.id, split.user_id, split.is_settled)}
                              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                              title={split.is_settled ? 'Mark as unpaid' : 'Mark as paid'}
                            />
                            <span className={split.user_id === user?.id ? 'font-bold text-[#484848]' : 'text-[#484848]'}>
                              {split.username}
                              {split.user_id === user?.id && ' (You)'}
                            </span>
                            {split.is_settled && <span className="text-xs text-green-600 font-medium">✓ Paid</span>}
                          </label>
                          <span className="font-bold text-[#5d41ab]">
                            ${parseFloat(split.amount_owed).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : expense.split_type === 'equal' && (
                    <div className="mt-2 bg-purple-50 border border-purple-200 rounded-xl p-2 text-sm">
                      <span className="font-medium text-[#484848]">Your share: </span>
                      <span className="text-[#5d41ab] font-bold">
                        ${(parseFloat(expense.amount) / 2).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-[#484848] mb-6">Add New Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Title</label>
                <input
                  type="text"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="e.g., Grocery shopping"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                >
                  <option value="groceries">Groceries</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent</option>
                  <option value="supplies">Supplies</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="internet">Internet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Split Type</label>
                <select
                  value={newExpense.split_type}
                  onChange={(e) => setNewExpense({ ...newExpense, split_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                >
                  <option value="equal">Split Equally (50/50)</option>
                  <option value="custom">Custom Split</option>
                  <option value="percentage">Percentage Split</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Description</label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  rows={2}
                  placeholder="Optional details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Date</label>
                <input
                  type="datetime-local"
                  value={newExpense.expense_date}
                  onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                />
              </div>

              {/* Member Selection */}
              {members.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">
                    Split with ({selectedMembers.length} selected)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border-2 border-gray-200 rounded-2xl p-3">
                    {members.map((member) => (
                      <label
                        key={member.user}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.user)}
                          onChange={() => toggleMember(member.user)}
                          className="w-5 h-5 text-[#5d41ab] rounded focus:ring-[#5d41ab]"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-[#5d41ab] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {member.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-[#484848]">{member.username}</span>
                          {member.user === user?.id && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                        {newExpense.split_type === 'percentage' && selectedMembers.includes(member.user) && (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={memberPercentages[member.user] || ''}
                            onChange={(e) => setMemberPercentages({
                              ...memberPercentages,
                              [member.user]: parseFloat(e.target.value) || 0
                            })}
                            className="w-20 px-2 py-1 text-sm border-2 border-gray-200 rounded-lg focus:border-[#5d41ab] outline-none"
                            placeholder="%"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {newExpense.split_type === 'custom' && selectedMembers.includes(member.user) && (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={memberAmounts[member.user] || ''}
                            onChange={(e) => setMemberAmounts({
                              ...memberAmounts,
                              [member.user]: parseFloat(e.target.value) || 0
                            })}
                            className="w-24 px-2 py-1 text-sm border-2 border-gray-200 rounded-lg focus:border-[#5d41ab] outline-none"
                            placeholder="$0.00"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                  {selectedMembers.length > 0 && newExpense.split_type === 'equal' && (
                    <p className="mt-2 text-sm text-[#484848] font-medium">
                      Each person pays: ${(parseFloat(newExpense.amount || '0') / selectedMembers.length).toFixed(2)}
                    </p>
                  )}
                  {newExpense.split_type === 'percentage' && (
                    <p className="mt-2 text-sm text-[#484848] font-medium">
                      Total: {Object.values(memberPercentages).reduce((sum, p) => sum + p, 0).toFixed(1)}%
                      {Math.abs(Object.values(memberPercentages).reduce((sum, p) => sum + p, 0) - 100) < 0.01 &&
                        <span className="text-green-600 ml-2">✓</span>
                      }
                    </p>
                  )}
                  {newExpense.split_type === 'custom' && (
                    <p className="mt-2 text-sm text-[#484848] font-medium">
                      Total: ${Object.values(memberAmounts).reduce((sum, a) => sum + a, 0).toFixed(2)} / ${parseFloat(newExpense.amount || '0').toFixed(2)}
                      {Math.abs(Object.values(memberAmounts).reduce((sum, a) => sum + a, 0) - parseFloat(newExpense.amount || '0')) < 0.01 && parseFloat(newExpense.amount || '0') > 0 &&
                        <span className="text-green-600 ml-2">✓</span>
                      }
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Expense'}
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

      {/* Edit Expense Modal */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-[#484848] mb-6">Edit Expense</h3>
            <form onSubmit={handleUpdateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Title</label>
                <input
                  type="text"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="e.g., Grocery shopping"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                >
                  <option value="groceries">Groceries</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent</option>
                  <option value="supplies">Supplies</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="internet">Internet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Split Type</label>
                <select
                  value={newExpense.split_type}
                  onChange={(e) => setNewExpense({ ...newExpense, split_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                >
                  <option value="equal">Split Equally (50/50)</option>
                  <option value="custom">Custom Split</option>
                  <option value="percentage">Percentage Split</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Description</label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  rows={2}
                  placeholder="Optional details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Date</label>
                <input
                  type="datetime-local"
                  value={newExpense.expense_date}
                  onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                />
              </div>

              {/* Member Selection */}
              {members.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#484848] mb-2">
                    Split with ({selectedMembers.length} selected)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border-2 border-gray-200 rounded-2xl p-3">
                    {members.map((member) => (
                      <label
                        key={member.user}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.user)}
                          onChange={() => toggleMember(member.user)}
                          className="w-5 h-5 text-[#5d41ab] rounded focus:ring-[#5d41ab]"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-[#5d41ab] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {member.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-[#484848]">{member.username}</span>
                          {member.user === user?.id && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                        {newExpense.split_type === 'percentage' && selectedMembers.includes(member.user) && (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={memberPercentages[member.user] || ''}
                            onChange={(e) => setMemberPercentages({
                              ...memberPercentages,
                              [member.user]: parseFloat(e.target.value) || 0
                            })}
                            className="w-20 px-2 py-1 text-sm border-2 border-gray-200 rounded-lg focus:border-[#5d41ab] outline-none"
                            placeholder="%"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {newExpense.split_type === 'custom' && selectedMembers.includes(member.user) && (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={memberAmounts[member.user] || ''}
                            onChange={(e) => setMemberAmounts({
                              ...memberAmounts,
                              [member.user]: parseFloat(e.target.value) || 0
                            })}
                            className="w-24 px-2 py-1 text-sm border-2 border-gray-200 rounded-lg focus:border-[#5d41ab] outline-none"
                            placeholder="$0.00"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                  {selectedMembers.length > 0 && newExpense.split_type === 'equal' && (
                    <p className="mt-2 text-sm text-[#484848] font-medium">
                      Each person pays: ${(parseFloat(newExpense.amount || '0') / selectedMembers.length).toFixed(2)}
                    </p>
                  )}
                  {newExpense.split_type === 'percentage' && (
                    <p className="mt-2 text-sm text-[#484848] font-medium">
                      Total: {Object.values(memberPercentages).reduce((sum, p) => sum + p, 0).toFixed(1)}%
                      {Math.abs(Object.values(memberPercentages).reduce((sum, p) => sum + p, 0) - 100) < 0.01 &&
                        <span className="text-green-600 ml-2">✓</span>
                      }
                    </p>
                  )}
                  {newExpense.split_type === 'custom' && (
                    <p className="mt-2 text-sm text-[#484848] font-medium">
                      Total: ${Object.values(memberAmounts).reduce((sum, a) => sum + a, 0).toFixed(2)} / ${parseFloat(newExpense.amount || '0').toFixed(2)}
                      {Math.abs(Object.values(memberAmounts).reduce((sum, a) => sum + a, 0) - parseFloat(newExpense.amount || '0')) < 0.01 && parseFloat(newExpense.amount || '0') > 0 &&
                        <span className="text-green-600 ml-2">✓</span>
                      }
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Expense'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingExpense(null)
                    setNewExpense({
                      title: '',
                      description: '',
                      category: 'groceries',
                      amount: '',
                      split_type: 'equal',
                      expense_date: new Date().toISOString().slice(0, 16),
                    })
                    setSelectedMembers([])
                    setMemberPercentages({})
                    setMemberAmounts({})
                  }}
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
