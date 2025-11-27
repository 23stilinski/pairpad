# Onboarding Progress Tracking System

## Overview
A comprehensive onboarding progress tracking system that monitors user registration and personality assessment completion with accurate progress metrics.

## Backend Implementation

### 1. Model: `OnboardingProgress` ([authentication/models.py](server/authentication/models.py))

**Core Fields:**
- `user` - OneToOne relationship with User
- `status` - Current onboarding status (6 states)
- Progress percentages: `registration_progress_percentage`, `assessment_progress_percentage`, `overall_progress_percentage`
- Step tracking: `completed_steps`, `total_steps`, `current_step`

**Registration Steps Tracking:**
- ✅ `account_created` - User account created
- ✅ `personal_info_completed` - Personal information filled
- ✅ `location_preferences_completed` - Location & budget set
- ✅ `lifestyle_preferences_completed` - Lifestyle preferences set

**Assessment Tracking:**
- ✅ `assessment_started` - Personality assessment begun
- ✅ `assessment_completed` - Assessment finished

**Key Methods:**
- `calculate_progress()` - Automatically calculates progress percentages
  - Registration: 60% weight (4 steps)
  - Assessment: 40% weight (2 milestones)
- `mark_*_completed()` - Mark individual steps as complete
- `calculate_profile_completeness()` - Calculate how complete the user profile is (0-100%)
- `get_next_step()` - Get the next onboarding step with URL

**Status Flow:**
```
not_started → registration_incomplete → registration_complete
→ assessment_in_progress → assessment_complete → completed
```

### 2. Admin Interface ([authentication/admin.py](server/authentication/admin.py))

**Features:**
- Color-coded progress display (red < 50%, yellow 50-74%, blue 75-99%, green 100%)
- List display with all progress metrics
- Detailed view with collapsible sections
- Bulk actions: recalculate progress, mark assessment started
- Filter by status, completion states, dates

### 3. API Endpoints ([authentication/views.py](server/authentication/views.py) & [authentication/urls.py](server/authentication/urls.py))

**Endpoints:**
```
GET  /api/auth/onboarding/progress/              - Get current user's progress
POST /api/auth/onboarding/progress/update/       - Update a specific step
POST /api/auth/onboarding/progress/recalculate/  - Manually recalculate progress
```

**Auto-creation:**
- Onboarding progress is automatically created during user registration
- `mark_account_created()` is called immediately after registration
- Returns progress data in registration response

### 4. Serializers ([authentication/serializers.py](server/authentication/serializers.py))

**OnboardingProgressSerializer:**
- Full progress data with camelCase field names for frontend
- Includes user data, all progress metrics, step statuses, timestamps
- Computed fields: `nextStep`, `isComplete`

**OnboardingProgressUpdateSerializer:**
- For updating individual steps
- Validates step choices
- Auto-calls appropriate marker methods

## Frontend Implementation

### 1. TypeScript Types ([client/lib/utils.ts](client/lib/utils.ts))

**OnboardingProgress Interface:**
```typescript
interface OnboardingProgress {
  id: string
  status: 'not_started' | 'registration_incomplete' | ...
  overallProgress: number
  registrationProgress: number
  assessmentProgress: number
  completedSteps: number
  totalSteps: number
  currentStep: string
  nextStep: { step: string, title: string, url: string }
  // ... and all tracking fields
}
```

### 2. API Functions ([client/lib/api.ts](client/lib/api.ts))

**Added to `auth` object:**
```typescript
getOnboardingProgress()           // Fetch current progress
updateOnboardingProgress(step)    // Update specific step
recalculateOnboardingProgress()   // Recalculate all progress
```

### 3. Zustand Store ([client/lib/store.ts](client/lib/store.ts))

**useOnboardingStore:**
- Persisted state for onboarding progress
- Actions: `setOnboardingProgress`, `updateProgress`, `clearProgress`
- LocalStorage persistence

### 4. UI Component ([client/components/ui/onboarding-progress.tsx](client/components/ui/onboarding-progress.tsx))

**Two Display Modes:**

**Compact View:**
- Simple progress bar
- Steps count
- Status text
- Perfect for sidebars/small spaces

**Detailed View:**
- Overall progress with color coding
- Registration & Assessment breakdown
- Step-by-step checklist with icons
- Next step suggestion with CTA button
- Completion celebration

**Features:**
- Auto-fetches progress on mount
- Color-coded progress indicators
- Responsive design
- Loading states
- Visual step completion indicators (checkmarks)

## Usage Guide

### Backend Usage

**When user registers:**
```python
# Automatically handled in UserRegistrationView
onboarding_progress = OnboardingProgress.objects.create(user=user)
onboarding_progress.mark_account_created()
```

**Updating progress:**
```python
# When user completes a step
progress = request.user.onboarding_progress
progress.mark_personal_info_completed()
progress.mark_location_preferences_completed()
progress.mark_lifestyle_preferences_completed()
progress.mark_assessment_started()
progress.mark_assessment_completed()
```

**Getting progress:**
```python
progress = user.onboarding_progress
next_step = progress.get_next_step()
is_done = progress.is_onboarding_complete()
```

### Frontend Usage

**Display progress in a page:**
```tsx
import { OnboardingProgressWidget } from '@/components/ui/onboarding-progress'

// Detailed view
<OnboardingProgressWidget showDetails={true} />

// Compact view for dashboard
<OnboardingProgressWidget compact={true} />
```

**Update progress programmatically:**
```tsx
import { auth } from '@/lib/api'
import { useOnboardingStore } from '@/lib/store'

const { setOnboardingProgress } = useOnboardingStore()

// After completing a step
const updatedProgress = await auth.updateOnboardingProgress('personal_info_completed')
setOnboardingProgress(updatedProgress)
```

**Access progress in components:**
```tsx
const { onboardingProgress } = useOnboardingStore()

if (onboardingProgress?.isComplete) {
  // Show completed state
}
```

## Migration

**Database Migration:**
```bash
cd server
source venv/bin/activate
python manage.py makemigrations authentication
python manage.py migrate authentication
```

## Testing Checklist

- [ ] Register new user → Progress created at 15% (account_created only)
- [ ] Complete registration steps → Progress increases to 60%
- [ ] Start assessment → Progress increases to 80%
- [ ] Complete assessment → Progress reaches 100%
- [ ] Check admin interface → All metrics displayed correctly
- [ ] Test API endpoints → GET and POST work correctly
- [ ] Frontend component → Loads and displays progress
- [ ] Profile completeness → Calculated based on filled fields

## Benefits

1. **Accurate Progress Tracking** - Weighted calculation (60% registration + 40% assessment)
2. **User Guidance** - Shows next step with clear CTA
3. **Visual Feedback** - Color-coded progress bars and step indicators
4. **Admin Visibility** - Admins can see completion rates and bottlenecks
5. **Flexible Display** - Compact and detailed views for different contexts
6. **Auto-recovery** - Creates progress record if missing
7. **Profile Completeness** - Additional metric for data quality

## Future Enhancements

- Email reminders for incomplete onboarding
- Analytics dashboard for onboarding funnel
- A/B testing different onboarding flows
- Gamification elements (badges, rewards)
- Time-to-complete metrics
- Step-specific help tooltips
