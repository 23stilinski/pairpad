# Shared Dashboard Implementation Guide

## Backend ✅ COMPLETED

### Models Created
1. **Match Model Updates**
   - `is_primary_for_user1`: Boolean flag for user1's primary match
   - `is_primary_for_user2`: Boolean flag for user2's primary match
   - `living_space`: Foreign key link to shared LivingSpace
   - Methods: `set_primary_for()`, `get_or_create_living_space()`

2. **ShoppingList & ShoppingListItem**
   - Track shared grocery/shopping needs
   - Mark items as purchased with timestamp and user

3. **Bill Model**
   - Track recurring bills (monthly, quarterly, yearly)
   - Status: pending, paid, overdue
   - Payment tracking with user and timestamp

4. **Notification Model**
   - Types: task_assigned, task_completed, expense_added, bill_due_soon, etc.
   - Link to related objects (task, expense, bill, living_space)
   - Read/unread status

5. **CalendarEvent Model**
   - Shared calendar for roommates
   - Event types: cleaning, maintenance, guests, bill_due, lease, other
   - Link to tasks and bills

### API Endpoints Created

#### Match Endpoints
- `POST /api/matching/<match_id>/set-primary/` - Set primary match
- `GET /api/matching/<match_id>/dashboard-info/` - Get match and living space info

#### Shared Dashboard
- `GET /api/coliving/shared-dashboard/<living_space_id>/` - Get all dashboard data

#### Shopping Lists
- `POST /api/coliving/<living_space_id>/shopping-lists/create/`
- `POST /api/coliving/shopping-lists/<list_id>/add-item/`
- `PATCH /api/coliving/shopping-items/<item_id>/toggle/`

#### Bills
- `POST /api/coliving/<living_space_id>/bills/create/`
- `PATCH /api/coliving/bills/<bill_id>/mark-paid/`

#### Calendar
- `POST /api/coliving/<living_space_id>/calendar-events/create/`

#### Notifications
- `GET /api/coliving/notifications/`
- `PATCH /api/coliving/notifications/<id>/mark-read/`

#### Existing Endpoints (Already Available)
- Tasks: `/api/coliving/tasks/`
- Expenses: `/api/coliving/expenses/`

---

## Frontend Implementation TODO

### 1. Create API Client Functions (`client/lib/api.ts`)

```typescript
// Add to existing api.ts
export const sharedDashboard = {
  // Match Management
  setTrimaryMatch: (matchId: number, isPrimary: boolean) =>
    api.post(`/api/matching/${matchId}/set-primary/`, { is_primary: isPrimary }),

  getDashboardInfo: (matchId: number) =>
    api.get(`/api/matching/${matchId}/dashboard-info/`),

  // Shared Dashboard
  getSharedDashboard: (livingSpaceId: number) =>
    api.get(`/api/coliving/shared-dashboard/${livingSpaceId}/`),

  // Shopping Lists
  createShoppingList: (livingSpaceId: number, name: string) =>
    api.post(`/api/coliving/${livingSpaceId}/shopping-lists/create/`, { name }),

  addShoppingItem: (listId: number, item: { name: string; quantity?: string; category?: string }) =>
    api.post(`/api/coliving/shopping-lists/${listId}/add-item/`, item),

  toggleShoppingItem: (itemId: number) =>
    api.patch(`/api/coliving/shopping-items/${itemId}/toggle/`, {}),

  // Bills
  createBill: (livingSpaceId: number, bill: BillData) =>
    api.post(`/api/coliving/${livingSpaceId}/bills/create/`, bill),

  markBillPaid: (billId: number) =>
    api.patch(`/api/coliving/bills/${billId}/mark-paid/`, {}),

  // Calendar Events
  createCalendarEvent: (livingSpaceId: number, event: CalendarEventData) =>
    api.post(`/api/coliving/${livingSpaceId}/calendar-events/create/`, event),

  // Notifications
  getNotifications: () =>
    api.get('/api/coliving/notifications/'),

  markNotificationRead: (notificationId: number) =>
    api.patch(`/api/coliving/notifications/${notificationId}/mark-read/`, {}),
}
```

### 2. Create Shared Dashboard Page

**File**: `client/app/dashboard/shared/[matchId]/page.tsx`

**Structure**:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { sharedDashboard } from '@/lib/api'

// Import components (to be created)
import TasksSection from '@/components/shared-dashboard/TasksSection'
import ExpensesSection from '@/components/shared-dashboard/ExpensesSection'
import BillsSection from '@/components/shared-dashboard/BillsSection'
import ShoppingListSection from '@/components/shared-dashboard/ShoppingListSection'
import CalendarSection from '@/components/shared-dashboard/CalendarSection'
import HouseRulesSection from '@/components/shared-dashboard/HouseRulesSection'
import NotificationsPanel from '@/components/shared-dashboard/NotificationsPanel'

export default function SharedDashboardPage() {
  const params = useParams()
  const matchId = params.matchId as string

  const [dashboardData, setDashboardData] = useState<any>(null)
  const [livingSpaceId, setLivingSpaceId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [matchId])

  const loadDashboard = async () => {
    try {
      // Get match info and living space
      const matchInfo = await sharedDashboard.getDashboardInfo(Number(matchId))
      setLivingSpaceId(matchInfo.data.living_space_id)

      // Get full dashboard data
      const dashboard = await sharedDashboard.getSharedDashboard(matchInfo.data.living_space_id)
      setDashboardData(dashboard.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with roommate info */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#484848]">
          {dashboardData.living_space.name}
        </h1>
      </div>

      {/* Notifications */}
      <NotificationsPanel notifications={dashboardData.notifications} />

      {/* Main Dashboard Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <TasksSection
            tasks={dashboardData.tasks}
            livingSpaceId={livingSpaceId}
            onUpdate={loadDashboard}
          />

          <ExpensesSection
            expenses={dashboardData.expenses}
            livingSpaceId={livingSpaceId}
            onUpdate={loadDashboard}
          />

          <CalendarSection
            events={dashboardData.calendar_events}
            livingSpaceId={livingSpaceId}
            onUpdate={loadDashboard}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <BillsSection
            bills={dashboardData.bills}
            livingSpaceId={livingSpaceId}
            onUpdate={loadDashboard}
          />

          <ShoppingListSection
            lists={dashboardData.shopping_lists}
            livingSpaceId={livingSpaceId}
            onUpdate={loadDashboard}
          />

          <HouseRulesSection
            rules={dashboardData.house_rules}
            livingSpaceId={livingSpaceId}
          />
        </div>
      </div>
    </div>
  )
}
```

### 3. Create Dashboard Components

#### TasksSection Component
**File**: `client/components/shared-dashboard/TasksSection.tsx`

Features:
- List of tasks with status badges
- Filter by status (pending, in_progress, completed)
- Add new task button with modal
- Assign task to roommate
- Mark task as complete
- Show due dates with color coding (overdue = red, due soon = orange)

#### ExpensesSection Component
**File**: `client/components/shared-dashboard/ExpensesSection.tsx`

Features:
- List of recent expenses
- Show who paid and split type
- Add new expense button with modal
- Visual split calculator
- Settlement tracking
- Monthly expense summary chart

#### BillsSection Component
**File**: `client/components/shared-dashboard/BillsSection.tsx`

Features:
- Upcoming bills list
- Overdue bills highlighted in red
- Add bill button with recurrence options
- Mark as paid button
- Recurring bill indicators

#### ShoppingListSection Component
**File**: `client/components/shared-dashboard/ShoppingListSection.tsx`

Features:
- Multiple shopping lists support
- Add item with quantity and category
- Check/uncheck items
- Show who purchased item
- Category grouping

#### CalendarSection Component
**File**: `client/components/shared-dashboard/CalendarSection.tsx`

Features:
- Month view calendar
- Event markers with color coding by type
- Add event modal
- Link tasks and bills to calendar
- Upcoming events list

#### HouseRulesSection Component
**File**: `client/components/shared-dashboard/HouseRulesSection.tsx`

Features:
- Display current house rules
- Edit rules (admin only)
- Categories: Quiet hours, guests, cleaning, smoking, pets
- Custom rules textarea

#### NotificationsPanel Component
**File**: `client/components/shared-dashboard/NotificationsPanel.tsx`

Features:
- Toast-style notification banners
- Dismissible notifications
- Click to navigate to related item
- Unread count badge

### 4. Update Matches Page

Add "Set as Primary" button to matches page:

```typescript
// In client/app/dashboard/matches/page.tsx
import { sharedDashboard } from '@/lib/api'

const handleSetPrimary = async (matchId: number) => {
  try {
    await sharedDashboard.setPrimaryMatch(matchId, true)
    toast.success('Primary match updated!')
    // Refresh matches
  } catch (error) {
    toast.error('Failed to set primary match')
  }
}

// Add button in match card:
<Link href={`/dashboard/shared/${match.id}`}>
  <button className="bg-[#5d41ab] text-white px-4 py-2 rounded-2xl">
    View Shared Dashboard
  </button>
</Link>

<button
  onClick={() => handleSetPrimary(match.id)}
  className="border-2 border-[#5d41ab] text-[#5d41ab] px-4 py-2 rounded-2xl"
>
  ⭐ Set as Primary
</button>
```

### 5. Add Navigation

Update dashboard navigation to include link to primary match dashboard:

```typescript
// In client/app/dashboard/layout.tsx or navigation component

// Fetch user's primary match on load
const primaryMatch = matches.find(m => m.is_primary)

{primaryMatch && (
  <Link href={`/dashboard/shared/${primaryMatch.id}`}>
    <div className="nav-item">
      🏠 Shared Dashboard
    </div>
  </Link>
)}
```

---

## Design Guidelines

### Colors
- Primary Purple: `#5d41ab`
- Dark Purple: `#4c2d87`
- Text Dark: `#484848`
- Text Light: `#9ca299`
- Success: `#10b981` (green-600)
- Warning: `#f59e0b` (orange-500)
- Error: `#ef4444` (red-500)

### Component Styling
- Use rounded-3xl for cards
- Shadow-lg for depth
- Hover effects with scale-105
- Smooth transitions
- Responsive grid layouts

### Icons
Consider using:
- `lucide-react` for consistent icon library
- Or custom SVG icons matching existing style

---

## Testing Checklist

### Backend Testing
- [ ] Create match and verify living_space is created
- [ ] Set primary match and verify only one is primary
- [ ] Add tasks and verify notifications are created
- [ ] Add expenses and verify splits are calculated
- [ ] Create shopping list and toggle items
- [ ] Create bills and mark as paid
- [ ] Create calendar events
- [ ] Verify all endpoints require authentication
- [ ] Test with multiple roommates

### Frontend Testing
- [ ] Navigate to shared dashboard from matches
- [ ] Verify all sections load correctly
- [ ] Test adding/editing/deleting items in each section
- [ ] Test real-time updates after actions
- [ ] Test responsive design on mobile
- [ ] Test with no data (empty states)
- [ ] Test notification display and dismissal
- [ ] Test primary match selection
- [ ] Test unauthorized access (should redirect)

---

## Next Steps

1. **Create API client functions** in `client/lib/api.ts`
2. **Create the main dashboard page** at `client/app/dashboard/shared/[matchId]/page.tsx`
3. **Create each section component** one by one in `client/components/shared-dashboard/`
4. **Test each feature** as you build it
5. **Add error handling and loading states**
6. **Implement responsive design**
7. **Add animations and transitions**

---

## Additional Features to Consider

### Phase 2 Enhancements
- Real-time updates with WebSockets
- Push notifications (browser notifications API)
- Export expenses to CSV
- Receipt photo upload for expenses
- Chore rotation automation
- Integration with calendar apps (Google Calendar, iCal)
- Budget analytics and charts
- Split payment integration (Venmo, PayPal)
- Move-in/move-out checklist
- Maintenance request system

---

## Database Schema Summary

```
Match
├── is_primary_for_user1: Boolean
├── is_primary_for_user2: Boolean
└── living_space: FK(LivingSpace)

LivingSpace
├── tasks: Many
├── expenses: Many
├── shopping_lists: Many
├── bills: Many
├── calendar_events: Many
└── notifications: Many

ShoppingList
└── items: Many(ShoppingListItem)

Bill
├── recurrence: monthly/quarterly/yearly
└── status: pending/paid/overdue

Notification
├── type: task_assigned/expense_added/bill_due_soon/etc
├── task: FK(Task) optional
├── expense: FK(Expense) optional
└── bill: FK(Bill) optional

CalendarEvent
├── task: FK(Task) optional
└── bill: FK(Bill) optional
```

---

## Environment Variables Required

No new environment variables needed. Uses existing Django and Next.js configuration.

---

## Deployment Notes

### Database Migrations
```bash
cd server
python manage.py makemigrations
python manage.py migrate
```

### Frontend Build
```bash
cd client
npm run build
```

All backend changes are backward compatible. Existing features will continue to work.

---

**Status**: Backend ✅ Complete | Frontend ⏳ Ready to Implement

**Estimated Frontend Implementation Time**: 8-12 hours for all features
