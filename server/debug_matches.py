#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
sys.path.append('/home/lnx/Desktop/projects/pairpad/server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pairpad_server.settings')
django.setup()

from matching.models import Match, MatchInteraction
from django.contrib.auth import get_user_model

User = get_user_model()

# Check all users
print("=== USERS ===")
for user in User.objects.all():
    print(f"User ID: {user.id}, Username: {user.username}")

print("\n=== MATCH INTERACTIONS ===")
for interaction in MatchInteraction.objects.all():
    print(f"User: {interaction.user.username} -> Target: {interaction.target_user.username}, Type: {interaction.interaction_type}")

print("\n=== MATCHES ===")
for match in Match.objects.all():
    print(f"Match ID: {match.id}, User1: {match.user1.username}, User2: {match.user2.username}, Status: {match.status}, Score: {match.compatibility_score}")