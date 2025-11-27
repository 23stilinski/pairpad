#!/usr/bin/env python
"""
Seed script to populate the database with sample data
Run with: python manage.py shell < seed_data.py
Or: python seed_data.py
"""

import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pairpad_server.settings')
django.setup()

from django.contrib.auth import get_user_model
from personality.models import PersonalityProfile, AssessmentQuestion
from matching.models import Match, CompatibilityScore, UserPreferences
from coliving.models import LivingSpace, Room, LivingSpaceMember
from authentication.models import OnboardingProgress

User = get_user_model()


def clear_data():
    """Clear all existing data"""
    print("🗑️  Clearing existing data...")
    User.objects.all().delete()
    AssessmentQuestion.objects.all().delete()
    LivingSpace.objects.all().delete()
    print("✅ Data cleared\n")


def seed_assessment_questions():
    """Seed personality assessment questions"""
    print("📝 Seeding assessment questions...")

    questions = [
        # Openness questions
        {"question_text": "I enjoy exploring new ideas and concepts", "trait": "openness", "question_type": "scale", "reverse_scored": False, "order": 1},
        {"question_text": "I prefer sticking to familiar routines", "trait": "openness", "question_type": "scale", "reverse_scored": True, "order": 2},
        {"question_text": "I'm curious about different cultures and perspectives", "trait": "openness", "question_type": "scale", "reverse_scored": False, "order": 3},
        {"question_text": "I enjoy artistic and creative activities", "trait": "openness", "question_type": "scale", "reverse_scored": False, "order": 4},

        # Conscientiousness questions
        {"question_text": "I keep my living space organized and tidy", "trait": "conscientiousness", "question_type": "scale", "reverse_scored": False, "order": 5},
        {"question_text": "I often procrastinate on important tasks", "trait": "conscientiousness", "question_type": "scale", "reverse_scored": True, "order": 6},
        {"question_text": "I pay attention to details", "trait": "conscientiousness", "question_type": "scale", "reverse_scored": False, "order": 7},
        {"question_text": "I make plans and stick to them", "trait": "conscientiousness", "question_type": "scale", "reverse_scored": False, "order": 8},

        # Extraversion questions
        {"question_text": "I feel energized when spending time with others", "trait": "extraversion", "question_type": "scale", "reverse_scored": False, "order": 9},
        {"question_text": "I prefer quiet evenings at home over social gatherings", "trait": "extraversion", "question_type": "scale", "reverse_scored": True, "order": 10},
        {"question_text": "I enjoy meeting new people", "trait": "extraversion", "question_type": "scale", "reverse_scored": False, "order": 11},
        {"question_text": "I'm comfortable being the center of attention", "trait": "extraversion", "question_type": "scale", "reverse_scored": False, "order": 12},

        # Agreeableness questions
        {"question_text": "I try to be cooperative and avoid conflict", "trait": "agreeableness", "question_type": "scale", "reverse_scored": False, "order": 13},
        {"question_text": "I'm quick to point out when others are wrong", "trait": "agreeableness", "question_type": "scale", "reverse_scored": True, "order": 14},
        {"question_text": "I'm empathetic and considerate of others' feelings", "trait": "agreeableness", "question_type": "scale", "reverse_scored": False, "order": 15},
        {"question_text": "I go out of my way to help others", "trait": "agreeableness", "question_type": "scale", "reverse_scored": False, "order": 16},

        # Neuroticism questions
        {"question_text": "I often feel stressed or anxious", "trait": "neuroticism", "question_type": "scale", "reverse_scored": False, "order": 17},
        {"question_text": "I stay calm under pressure", "trait": "neuroticism", "question_type": "scale", "reverse_scored": True, "order": 18},
        {"question_text": "I worry about things that might go wrong", "trait": "neuroticism", "question_type": "scale", "reverse_scored": False, "order": 19},
        {"question_text": "I'm emotionally stable and even-tempered", "trait": "neuroticism", "question_type": "scale", "reverse_scored": True, "order": 20},
    ]

    for q_data in questions:
        AssessmentQuestion.objects.create(**q_data)

    print(f"✅ Created {len(questions)} assessment questions\n")


def seed_users():
    """Seed sample users with different personalities"""
    print("👥 Seeding sample users...")

    users_data = [
        {
            "email": "alex.chen@email.com",
            "username": "alex_chen",
            "password": "password123",
            "role": "student",
            "first_name": "Alex",
            "last_name": "Chen",
            "date_of_birth": date(2001, 3, 15),
            "gender": "male",
            "phone_number": "+1234567890",
            "current_city": "San Francisco",
            "preferred_city": "San Francisco",
            "budget_min": 800,
            "budget_max": 1200,
            "move_in_date": date.today() + timedelta(days=30),
            "lease_duration": "6_months",
            "bio": "CS major at UC Berkeley. Love coding, gaming, and hiking on weekends.",
            "occupation": "Student",
            "education": "UC Berkeley",
            "interests": "Programming, Gaming, Hiking, Photography",
            "personality": {
                "openness": 75,
                "conscientiousness": 65,
                "extraversion": 55,
                "agreeableness": 70,
                "neuroticism": 40,
                "cleanliness_level": 60,
                "social_level": 55,
                "quiet_hours": True,
                "pets_allowed": True,
                "smoking_allowed": False,
            }
        },
        {
            "email": "sarah.johnson@email.com",
            "username": "sarah_j",
            "password": "password123",
            "role": "professional",
            "first_name": "Sarah",
            "last_name": "Johnson",
            "date_of_birth": date(1998, 7, 22),
            "gender": "female",
            "phone_number": "+1234567891",
            "current_city": "San Francisco",
            "preferred_city": "San Francisco",
            "budget_min": 1000,
            "budget_max": 1500,
            "move_in_date": date.today() + timedelta(days=45),
            "lease_duration": "12_months",
            "bio": "Product designer at a startup. Love yoga, cooking, and exploring new restaurants.",
            "occupation": "Product Designer",
            "education": "Stanford University",
            "interests": "Design, Yoga, Cooking, Travel",
            "personality": {
                "openness": 85,
                "conscientiousness": 80,
                "extraversion": 70,
                "agreeableness": 85,
                "neuroticism": 35,
                "cleanliness_level": 85,
                "social_level": 70,
                "quiet_hours": False,
                "pets_allowed": True,
                "smoking_allowed": False,
            }
        },
        {
            "email": "mike.torres@email.com",
            "username": "mike_t",
            "password": "password123",
            "role": "professional",
            "first_name": "Mike",
            "last_name": "Torres",
            "date_of_birth": date(1997, 11, 8),
            "gender": "male",
            "phone_number": "+1234567892",
            "current_city": "San Francisco",
            "preferred_city": "San Francisco",
            "budget_min": 1200,
            "budget_max": 1800,
            "move_in_date": date.today() + timedelta(days=20),
            "lease_duration": "12_months",
            "bio": "Software engineer who loves fitness and outdoor activities. Looking for active roommates.",
            "occupation": "Software Engineer",
            "education": "MIT",
            "interests": "Fitness, Rock Climbing, Cycling, Tech",
            "personality": {
                "openness": 70,
                "conscientiousness": 75,
                "extraversion": 80,
                "agreeableness": 65,
                "neuroticism": 30,
                "cleanliness_level": 70,
                "social_level": 85,
                "quiet_hours": False,
                "pets_allowed": False,
                "smoking_allowed": False,
            }
        },
        {
            "email": "emma.wilson@email.com",
            "username": "emma_w",
            "password": "password123",
            "role": "student",
            "first_name": "Emma",
            "last_name": "Wilson",
            "date_of_birth": date(2002, 5, 30),
            "gender": "female",
            "phone_number": "+1234567893",
            "current_city": "San Francisco",
            "preferred_city": "San Francisco",
            "budget_min": 700,
            "budget_max": 1000,
            "move_in_date": date.today() + timedelta(days=60),
            "lease_duration": "6_months",
            "bio": "Art student with a passion for painting and music. Love cats and quiet spaces.",
            "occupation": "Student",
            "education": "SF Art Institute",
            "interests": "Painting, Music, Reading, Cats",
            "personality": {
                "openness": 90,
                "conscientiousness": 55,
                "extraversion": 40,
                "agreeableness": 80,
                "neuroticism": 55,
                "cleanliness_level": 50,
                "social_level": 40,
                "quiet_hours": True,
                "pets_allowed": True,
                "smoking_allowed": False,
            }
        },
        {
            "email": "james.park@email.com",
            "username": "james_p",
            "password": "password123",
            "role": "professional",
            "first_name": "James",
            "last_name": "Park",
            "date_of_birth": date(1999, 9, 12),
            "gender": "male",
            "phone_number": "+1234567894",
            "current_city": "San Francisco",
            "preferred_city": "San Francisco",
            "budget_min": 900,
            "budget_max": 1400,
            "move_in_date": date.today() + timedelta(days=40),
            "lease_duration": "12_months",
            "bio": "Marketing professional who enjoys socializing and hosting game nights.",
            "occupation": "Marketing Manager",
            "education": "UCLA",
            "interests": "Board Games, Movies, Craft Beer, Socializing",
            "personality": {
                "openness": 65,
                "conscientiousness": 60,
                "extraversion": 85,
                "agreeableness": 75,
                "neuroticism": 45,
                "cleanliness_level": 55,
                "social_level": 90,
                "quiet_hours": False,
                "pets_allowed": False,
                "smoking_allowed": False,
            }
        },
    ]

    created_users = []
    for user_data in users_data:
        personality_data = user_data.pop('personality')
        user = User.objects.create_user(**user_data)

        # Create personality profile
        PersonalityProfile.objects.create(
            user=user,
            **personality_data,
            communication_style='diplomatic'
        )

        # Mark onboarding as complete
        onboarding, _ = OnboardingProgress.objects.get_or_create(user=user)
        onboarding.mark_step_complete(OnboardingProgress.STEP_ACCOUNT)
        onboarding.mark_step_complete(OnboardingProgress.STEP_PERSONAL)
        onboarding.mark_step_complete(OnboardingProgress.STEP_LOCATION)
        onboarding.mark_step_complete(OnboardingProgress.STEP_LIFESTYLE)
        onboarding.mark_step_complete(OnboardingProgress.STEP_ASSESSMENT_DONE)

        created_users.append(user)
        print(f"  ✓ Created user: {user.username}")

    print(f"✅ Created {len(created_users)} users\n")
    return created_users


def calculate_compatibility(user1, user2):
    """Calculate compatibility score between two users"""
    try:
        profile1 = user1.personality_profile
        profile2 = user2.personality_profile

        # Simple compatibility calculation based on personality similarity
        traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
        differences = []

        for trait in traits:
            val1 = getattr(profile1, trait, 50)
            val2 = getattr(profile2, trait, 50)
            diff = abs(val1 - val2)
            differences.append(diff)

        avg_diff = sum(differences) / len(differences)
        compatibility = max(0, 100 - avg_diff)

        return round(compatibility, 2)
    except:
        return 50.0  # Default score if profiles don't exist


def seed_matches(users):
    """Create matches and compatibility scores between users"""
    print("💕 Seeding matches and compatibility scores...")

    # Create some matches
    matches_created = 0

    # Alex and Sarah - mutual match
    match1, _ = Match.objects.get_or_create(
        user1=users[0],
        user2=users[1],
        defaults={
            'status': 'mutual',
            'compatibility_score': calculate_compatibility(users[0], users[1])
        }
    )
    matches_created += 1

    # Alex and Emma - pending (Alex liked Emma)
    match2, _ = Match.objects.get_or_create(
        user1=users[0],
        user2=users[3],
        defaults={
            'status': 'pending',
            'compatibility_score': calculate_compatibility(users[0], users[3])
        }
    )
    matches_created += 1

    # Sarah and Mike - mutual match
    match3, _ = Match.objects.get_or_create(
        user1=users[1],
        user2=users[2],
        defaults={
            'status': 'mutual',
            'compatibility_score': calculate_compatibility(users[1], users[2])
        }
    )
    matches_created += 1

    # Mike and James - mutual match
    match4, _ = Match.objects.get_or_create(
        user1=users[2],
        user2=users[4],
        defaults={
            'status': 'mutual',
            'compatibility_score': calculate_compatibility(users[2], users[4])
        }
    )
    matches_created += 1

    # Emma and Sarah - pending (Emma liked Sarah)
    match5, _ = Match.objects.get_or_create(
        user1=users[3],
        user2=users[1],
        defaults={
            'status': 'pending',
            'compatibility_score': calculate_compatibility(users[3], users[1])
        }
    )
    matches_created += 1

    print(f"✅ Created {matches_created} matches\n")


def seed_living_spaces(users):
    """Create sample living spaces"""
    print("🏠 Seeding living spaces...")

    spaces_data = [
        {
            "name": "Spacious 3BR Apartment in Mission District",
            "description": "Beautiful apartment with lots of natural light. Close to BART and great restaurants.",
            "address": "123 Valencia St",
            "city": "San Francisco",
            "state": "CA",
            "zip_code": "94110",
            "country": "USA",
            "space_type": "apartment",
            "total_bedrooms": 3,
            "total_bathrooms": Decimal('2.0'),
            "total_rent": Decimal('3600.00'),
            "utilities_included": False,
            "furnished": False,
            "available_from": date.today(),
            "lease_duration_months": 12,
            "created_by": users[1],  # Sarah
            "is_public": True,
        },
        {
            "name": "Modern 2BR Condo in SoMa",
            "description": "Tech-friendly building with gym and rooftop access. Perfect for professionals.",
            "address": "456 Howard St",
            "city": "San Francisco",
            "state": "CA",
            "zip_code": "94105",
            "country": "USA",
            "space_type": "condo",
            "total_bedrooms": 2,
            "total_bathrooms": Decimal('1.0'),
            "total_rent": Decimal('3200.00'),
            "utilities_included": True,
            "furnished": True,
            "available_from": date.today() + timedelta(days=30),
            "lease_duration_months": 12,
            "created_by": users[2],  # Mike
            "is_public": True,
        },
    ]

    created_spaces = []
    for space_data in spaces_data:
        space = LivingSpace.objects.create(**space_data)

        # Add creator as member
        LivingSpaceMember.objects.create(
            living_space=space,
            user=space.created_by,
            role='admin'
        )

        created_spaces.append(space)
        print(f"  ✓ Created living space: {space.name}")

    # Create rooms for first space
    Room.objects.create(
        living_space=created_spaces[0],
        name="Room 1",
        room_type="master_bedroom",
        monthly_rent=Decimal('1200.00'),
        is_available=True,
        available_from=date.today(),
        has_private_bathroom=True,
        description="Master bedroom with private bathroom"
    )

    Room.objects.create(
        living_space=created_spaces[0],
        name="Room 2",
        room_type="bedroom",
        monthly_rent=Decimal('1200.00'),
        is_available=True,
        available_from=date.today() + timedelta(days=15),
        has_balcony=True,
        description="Bright room with bay window"
    )

    print(f"✅ Created {len(created_spaces)} living spaces with rooms\n")


def main():
    """Main seeding function"""
    print("\n" + "="*50)
    print("🌱 Starting database seeding...")
    print("="*50 + "\n")

    # Prompt for confirmation
    response = input("This will clear all existing data. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Seeding cancelled")
        return

    clear_data()
    seed_assessment_questions()
    users = seed_users()
    seed_matches(users)
    seed_living_spaces(users)

    print("="*50)
    print("✅ Database seeding completed successfully!")
    print("="*50)
    print("\n📊 Summary:")
    print(f"  • Users: {User.objects.count()}")
    print(f"  • Assessment Questions: {AssessmentQuestion.objects.count()}")
    print(f"  • Personality Profiles: {PersonalityProfile.objects.count()}")
    print(f"  • Matches: {Match.objects.count()}")
    print(f"  • Living Spaces: {LivingSpace.objects.count()}")
    print(f"  • Rooms: {Room.objects.count()}")
    print("\n🔑 Test credentials:")
    print("  Email: alex.chen@email.com")
    print("  Email: sarah.johnson@email.com")
    print("  Email: mike.torres@email.com")
    print("  Email: emma.wilson@email.com")
    print("  Email: james.park@email.com")
    print("  Password: password123 (for all users)")
    print()


if __name__ == "__main__":
    main()
