'use client'

import { useState } from 'react'
import { sharedDashboard } from '@/lib/api'
import toast from 'react-hot-toast'

interface ShoppingListItem {
  id: number
  name: string
  quantity: string
  category: string
  is_purchased: boolean
  purchased_by: string | null
  added_by: string
}

interface ShoppingList {
  id: number
  name: string
  items: ShoppingListItem[]
  created_by: string
}

interface ShoppingListSectionProps {
  lists: ShoppingList[]
  livingSpaceId: number
  onUpdate: () => void
}

export default function ShoppingListSection({ lists, livingSpaceId, onUpdate }: ShoppingListSectionProps) {
  const [showAddListModal, setShowAddListModal] = useState(false)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [selectedList, setSelectedList] = useState<number | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    category: '',
  })
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await sharedDashboard.createShoppingList(livingSpaceId, newListName)
      toast.success('Shopping list created!')
      setShowAddListModal(false)
      setNewListName('')
      onUpdate()
    } catch (error) {
      console.error('Failed to create list:', error)
      toast.error('Failed to create list')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedList) return

    try {
      setLoading(true)
      await sharedDashboard.addShoppingItem(selectedList, newItem)
      toast.success('Item added!')
      setShowAddItemModal(false)
      setNewItem({ name: '', quantity: '', category: '' })
      onUpdate()
    } catch (error) {
      console.error('Failed to add item:', error)
      toast.error('Failed to add item')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleItem = async (itemId: number) => {
    try {
      setToggling(itemId)
      await sharedDashboard.toggleShoppingItem(itemId)
      onUpdate()
    } catch (error) {
      console.error('Failed to toggle item:', error)
      toast.error('Failed to update item')
    } finally {
      setToggling(null)
    }
  }

  const openAddItemModal = (listId: number) => {
    setSelectedList(listId)
    setShowAddItemModal(true)
  }

  const activeList = lists.length > 0 ? lists[0] : null
  const pendingItems = activeList?.items.filter(item => !item.is_purchased) || []
  const completedItems = activeList?.items.filter(item => item.is_purchased) || []

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#484848]">Shopping</h2>
        <div className="flex gap-2">
          {lists.length === 0 ? (
            <button
              onClick={() => setShowAddListModal(true)}
              className="bg-[#5d41ab] text-white px-3 py-2 rounded-2xl text-sm font-medium hover:bg-[#4c2d87] transition-all"
            >
              + New List
            </button>
          ) : (
            activeList && (
              <button
                onClick={() => openAddItemModal(activeList.id)}
                className="bg-[#5d41ab] text-white px-3 py-2 rounded-2xl text-sm font-medium hover:bg-[#4c2d87] transition-all"
              >
                + Add Item
              </button>
            )
          )}
        </div>
      </div>

      {/* Shopping List */}
      {!activeList ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🛒</div>
          <p className="text-sm text-gray-500">Create a shopping list</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* List Name */}
          <div className="bg-gradient-to-r from-[#5d41ab]/10 to-purple-100 rounded-2xl p-3">
            <h3 className="font-bold text-[#484848]">{activeList.name}</h3>
            <p className="text-xs text-gray-600">
              {pendingItems.length} item(s) to buy
            </p>
          </div>

          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-600 uppercase">To Buy</h4>
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 border-2 border-gray-100 rounded-xl hover:border-[#5d41ab] transition-all"
                >
                  <button
                    onClick={() => handleToggleItem(item.id)}
                    disabled={toggling === item.id}
                    className="w-5 h-5 rounded border-2 border-gray-300 hover:border-[#5d41ab] transition-all flex-shrink-0"
                  >
                    {toggling === item.id && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-[#5d41ab] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="font-medium text-[#484848]">{item.name}</div>
                    {item.quantity && (
                      <div className="text-xs text-gray-500">{item.quantity}</div>
                    )}
                  </div>
                  {item.category && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-600 uppercase">Purchased</h4>
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl opacity-60"
                >
                  <button
                    onClick={() => handleToggleItem(item.id)}
                    disabled={toggling === item.id}
                    className="w-5 h-5 rounded bg-green-500 flex items-center justify-center text-white flex-shrink-0"
                  >
                    {toggling === item.id ? '...' : '✓'}
                  </button>
                  <div className="flex-1">
                    <div className="font-medium text-gray-500 line-through">{item.name}</div>
                    {item.purchased_by && (
                      <div className="text-xs text-gray-400">by {item.purchased_by}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeList.items.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No items yet. Add some items to get started!
            </div>
          )}
        </div>
      )}

      {/* Create List Modal */}
      {showAddListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-[#484848] mb-6">New Shopping List</h3>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">List Name</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="e.g., Weekly Groceries"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddListModal(false)}
                  className="flex-1 bg-gray-200 text-[#484848] py-3 rounded-2xl font-medium hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-[#484848] mb-6">Add Item</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="e.g., Milk"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Quantity (Optional)</label>
                <input
                  type="text"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="e.g., 2 liters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Category (Optional)</label>
                <input
                  type="text"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  placeholder="e.g., Dairy"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
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
