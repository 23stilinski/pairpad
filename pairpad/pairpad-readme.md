# PairPad - Roommate Compatibility and Co-Living Management System

## Project Overview

PairPad is a comprehensive web-based platform designed to revolutionize the roommate matching process through scientific personality assessment and intelligent compatibility analysis. The system addresses the challenges of finding compatible roommates by combining behavioral psychology principles with modern web technologies.

## Problem Statement

Traditional roommate matching methods rely on superficial criteria or random assignments, leading to household conflicts and unsatisfactory living experiences. PairPad solves this by providing:
- Science-based personality compatibility assessment
- Intelligent matching algorithms
- Integrated co-living management tools
- Secure communication channels

## Target Users

- University students
- Young professionals
- Urban renters
- Housing coordinators (secondary users)

## Core Features

### 1. User Management Module
- Multi-role support (Student, Young Professional, Administrator, Housing Coordinator)
- Profile creation with comprehensive personality assessment
- User verification and authentication
- Role-based access control

### 2. Personality Assessment Module
- Comprehensive personality evaluation using validated psychological frameworks
- Big Five personality traits integration
- Lifestyle preference assessment
- Communication style evaluation

### 3. Compatibility Matching Engine
- Advanced algorithms for compatibility scoring
- Multi-dimensional matching criteria
- Location-based filtering
- Real-time match suggestions

### 4. Communication System
- Secure in-app messaging
- Pre-meeting communication framework
- Notification system for new matches
- Structured conversation guides for important topics

### 5. Co-Living Management Dashboard
- Shared task management
- Expense tracking and splitting
- Household calendar
- Conflict resolution tools
- Resource coordination

### 6. Safety & Reporting System
- User verification processes
- Report and moderation features
- Community guidelines enforcement
- Privacy controls

## Technical Architecture

### Tech Stack

#### Server
- **Framework**: Python with Django
- **Database**: SQLite (for development/testing)
- **Real-time Communication**: Socket.IO
- **Authentication**: Django Auth with JWT tokens

#### Client
- **Framework**: Next.js (React-based framework)
- **State Management**: React Context API / Redux / Zustand
- **UI Components**: Modern responsive design with Tailwind CSS
- **Styling**: Tailwind CSS + CSS Modules

#### Additional Technologies
- **API Integration**: RESTful APIs
- **Security**: JWT for secure communication, end-to-end encryption for sensitive data
- **Deployment**: Cloud infrastructure (AWS/Google Cloud/Heroku)

> **Note**: SQLite is used for development and testing. For production deployment, consider migrating to PostgreSQL or MySQL for better performance and concurrent access.

## System Design

### Database Schema (Main Entities)

```
Users
- user_id (PK)
- email
- username
- role
- verification_status
- created_at
- updated_at

PersonalityProfiles
- profile_id (PK)
- user_id (FK)
- personality_scores (JSON)
- lifestyle_preferences (JSON)
- communication_style
- completed_at

Matches
- match_id (PK)
- user1_id (FK)
- user2_id (FK)
- compatibility_score
- match_status
- created_at

Messages
- message_id (PK)
- sender_id (FK)
- receiver_id (FK)
- content
- timestamp
- read_status

CoLivingSpaces
- space_id (PK)
- members (Array of user_ids)
- tasks (JSON)
- expenses (JSON)
- house_rules (JSON)
```

## Project Structure

```
pairpad/
├── server/
│   ├── api/
│   │   ├── views/
│   │   ├── serializers/
│   │   ├── urls.py
│   │   └── models.py
│   ├── authentication/
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── utils.py
│   ├── personality/
│   │   ├── assessment.py
│   │   ├── scoring.py
│   │   └── models.py
│   ├── matching/
│   │   ├── algorithm.py
│   │   ├── compatibility.py
│   │   └── recommendations.py
│   ├── messaging/
│   │   ├── views.py
│   │   ├── websocket.py
│   │   └── models.py
│   ├── coliving/
│   │   ├── tasks.py
│   │   ├── expenses.py
│   │   └── models.py
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   └── requirements.txt
│
├── client/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.js
│   │   │   ├── register/
│   │   │   │   └── page.js
│   │   │   └── layout.js
│   │   ├── dashboard/
│   │   │   ├── page.js
│   │   │   └── layout.js
│   │   ├── personality/
│   │   │   ├── assessment/
│   │   │   │   └── page.js
│   │   │   └── profile/
│   │   │       └── page.js
│   │   ├── matches/
│   │   │   ├── page.js
│   │   │   └── [userId]/
│   │   │       └── page.js
│   │   ├── messages/
│   │   │   └── [matchId]/
│   │   │       └── page.js
│   │   ├── coliving/
│   │   │   ├── page.js
│   │   │   ├── tasks/
│   │   │   └── expenses/
│   │   ├── layout.js
│   │   ├── page.js
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   ├── auth/
│   │   ├── personality/
│   │   ├── matching/
│   │   ├── messaging/
│   │   └── coliving/
│   ├── lib/
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── websocket.js
│   ├── public/
│   │   └── images/
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── docs/
│   ├── api_documentation.md
│   ├── user_guide.md
│   └── deployment_guide.md
│
└── README.md
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 18+ (for Next.js 14+)

### Server Setup

1. Clone the repository
```bash
git clone <repository-url>
cd pairpad
```

2. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
cd server
pip install -r requirements.txt
```

4. Configure database
```bash
# SQLite database will be automatically created
# Default location: server/db.sqlite3
# Update settings/development.py if needed:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }
```

5. Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create superuser
```bash
python manage.py createsuperuser
```

7. Run development server
```bash
python manage.py runserver
```

### Client Setup

1. Navigate to client directory
```bash
cd client
```

2. Install dependencies
```bash
npm install
# or if creating from scratch:
# npx create-next-app@latest . --tailwind --app
```

3. Configure environment variables
```bash
# Create .env.local file with:
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/ws
```

4. Run development server
```bash
npm run dev
# App will be available at http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get user profile

### Personality Assessment
- `GET /api/personality/assessment/` - Get assessment questions
- `POST /api/personality/submit/` - Submit assessment responses
- `GET /api/personality/profile/` - Get personality profile

### Matching
- `GET /api/matches/suggestions/` - Get match suggestions
- `POST /api/matches/accept/` - Accept a match
- `POST /api/matches/reject/` - Reject a match
- `GET /api/matches/compatibility/:user_id/` - Get compatibility score

### Messaging
- `GET /api/messages/:match_id/` - Get messages for a match
- `POST /api/messages/send/` - Send message
- `WS /ws/chat/:room_name/` - WebSocket for real-time messaging

### Co-Living Management
- `GET /api/coliving/dashboard/` - Get dashboard data
- `POST /api/coliving/tasks/` - Create task
- `POST /api/coliving/expenses/` - Add expense
- `PUT /api/coliving/rules/` - Update house rules

## Key Algorithms

### Compatibility Scoring Algorithm
The system uses a weighted multi-factor compatibility score:
- Personality compatibility (40%)
- Lifestyle preferences (30%)
- Communication style (20%)
- Location proximity (10%)

### Personality Assessment
Based on Big Five personality traits:
- Openness
- Conscientiousness
- Extraversion
- Agreeableness
- Neuroticism





*Note: This README provides the core structure and requirements for the PairPad system. Specific implementation details may vary based on development decisions.*