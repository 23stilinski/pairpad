#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
sys.path.append('/home/lnx/Desktop/projects/pairpad/server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pairpad_server.settings')
django.setup()

from matching.models import MatchInteraction
from django.contrib.auth import get_user_model

User = get_user_model()

# Get alice and lnxmwita users
try:
    alice = User.objects.get(username='alice')
    lnxmwita = User.objects.get(username='lnxmwita')

    # Create a like from alice to lnxmwita
    interaction, created = MatchInteraction.objects.get_or_create(
        user=alice,
        target_user=lnxmwita,
        defaults={'interaction_type': 'like'}
    )

    if created:
        print(f"Created like interaction: {alice.username} -> {lnxmwita.username}")
    else:
        print(f"Interaction already exists: {alice.username} -> {lnxmwita.username}")

    print("Now lnxmwita should see alice's request in the /dashboard/requests page")

except User.DoesNotExist as e:
    print(f"User not found: {e}")