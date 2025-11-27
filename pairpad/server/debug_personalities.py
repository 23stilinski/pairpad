#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
sys.path.append('/home/lnx/Desktop/projects/pairpad/server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pairpad_server.settings')
django.setup()

from personality.models import PersonalityProfile
from django.contrib.auth import get_user_model

User = get_user_model()

print("=== PERSONALITY PROFILES ===")
for user in User.objects.all():
    try:
        profile = user.personality_profile
        print(f"User: {user.username} (ID: {user.id}) - HAS personality profile")
    except PersonalityProfile.DoesNotExist:
        print(f"User: {user.username} (ID: {user.id}) - NO personality profile")