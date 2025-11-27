'use client'

import { useState } from 'react'
import { sharedDashboard } from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'

interface Task {
  id: number
  title: string
  description: string
  category: string
  assigned_to: string
  created_by: string
  due_date: string | null
  status: string
  completed_at: string | null
}

interface TasksSectionProps {
  tasks: Task[]
  livingSpaceId: number
  otherUser: any
  onUpdate: () => void
}

export default function TasksSection({ tasks, livingSpaceId, otherUser, onUpdate }: TasksSectionProps) {
  const { user } = useAuthStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'cleaning',
    assigned_to: '',
    due_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const taskData: any = {
        living_space: livingSpaceId,
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        due_date: newTask.due_date || null,
      }

      // Only add assigned_to_id if a user is selected
      if (newTask.assigned_to) {
        taskData.assigned_to_id = Number(newTask.assigned_to)
      }

      await sharedDashboard.createTask(taskData)
      toast.success('Task created successfully!')
      setShowAddModal(false)
      setNewTask({ title: '', description: '', category: 'cleaning', assigned_to: '', due_date: '' })
      onUpdate()
    } catch (error) {
      console.error('Failed to create task:', error)
      toast.error('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (taskId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      await sharedDashboard.updateTask(taskId, { status: newStatus })
      toast.success(newStatus === 'completed' ? 'Task completed!' : 'Task reopened')
      onUpdate()
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to update task')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleaning': return '🧹'
      case 'maintenance': return '🔧'
      case 'groceries': return '🛒'
      case 'bills': return '💰'
      default: return '📋'
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    if (filter === 'my') return task.assigned_to === user?.username
    if (filter === 'pending') return task.status === 'pending'
    if (filter === 'completed') return task.status === 'completed'
    return true
  })

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#484848]">Tasks</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#5d41ab] text-white px-4 py-2 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all hover:scale-105"
        >
          + Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'my', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl font-medium transition-all capitalize ${
              filter === f
                ? 'bg-[#5d41ab] text-white'
                : 'bg-gray-100 text-[#484848] hover:bg-gray-200'
            }`}
          >
            {f === 'my' ? 'My Tasks' : f}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-500">No tasks yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="border-2 border-gray-100 rounded-2xl p-4 hover:border-[#5d41ab] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getCategoryIcon(task.category)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-[#484848]">{task.title}</h4>
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(task.status)} capitalize`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>👤 {task.assigned_to}</span>
                    {task.due_date && (
                      <span>📅 {new Date(task.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleStatus(task.id, task.status)}
                  className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                    task.status === 'completed'
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {task.status === 'completed' ? 'Reopen' : 'Complete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-[#484848] mb-6">Add New Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Category</label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                >
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="groceries">Groceries</option>
                  <option value="bills">Bills</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Assign To</label>
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                  required
                >
                  <option value="">Select person</option>
                  <option value={user?.id}>{user?.username} (Me)</option>
                  <option value={otherUser.id}>{otherUser.username}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#484848] mb-2">Due Date</label>
                <input
                  type="datetime-local"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#5d41ab] outline-none text-[#484848]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#5d41ab] text-white py-3 rounded-2xl font-medium hover:bg-[#4c2d87] transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Task'}
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
