from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Match, MatchInteraction, CompatibilityScore
from personality.models import PersonalityProfile
from authentication.serializers import UserSerializer
import math

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_match_suggestions(request):
    """Get compatible user suggestions"""
    current_user = request.user

    # Get users who haven't been interacted with
    interacted_users = MatchInteraction.objects.filter(user=current_user).values_list('target_user_id', flat=True)
    excluded_users = list(interacted_users) + [current_user.id]

    # Get users with personality profiles
    suggested_users = User.objects.filter(
        personality_profile__isnull=False
    ).exclude(id__in=excluded_users)[:10]

    # Calculate compatibility scores
    suggestions_with_scores = []
    for user in suggested_users:
        compatibility_data = calculate_compatibility(current_user, user)
        user_data = UserSerializer(user).data

        # Handle both old (int) and new (dict) return formats
        if isinstance(compatibility_data, dict):
            user_data['compatibility_score'] = compatibility_data['compatibility_score']
            user_data['similarity_score'] = compatibility_data['similarity_score']
            user_data['score_breakdown'] = compatibility_data['breakdown']
        else:
            user_data['compatibility_score'] = compatibility_data
            user_data['similarity_score'] = compatibility_data

        suggestions_with_scores.append(user_data)

    # Sort by compatibility score
    suggestions_with_scores.sort(key=lambda x: x['compatibility_score'], reverse=True)

    return Response(suggestions_with_scores)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_match(request):
    """Accept/like a user"""
    target_user_id = request.data.get('user_id')

    try:
        target_user = User.objects.get(id=target_user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # Create interaction
    interaction, created = MatchInteraction.objects.get_or_create(
        user=request.user,
        target_user=target_user,
        defaults={'interaction_type': 'like'}
    )

    # Check if it's mutual
    mutual_interaction = MatchInteraction.objects.filter(
        user=target_user,
        target_user=request.user,
        interaction_type='like'
    ).exists()

    if mutual_interaction:
        # Create match
        compatibility_data = calculate_compatibility(request.user, target_user)
        compat_score = compatibility_data['compatibility_score'] if isinstance(compatibility_data, dict) else compatibility_data

        match, created = Match.objects.get_or_create(
            user1=min(request.user, target_user, key=lambda x: x.id),
            user2=max(request.user, target_user, key=lambda x: x.id),
            defaults={
                'compatibility_score': compat_score,
                'status': 'mutual'
            }
        )

        response_data = {
            'message': 'Match created!',
            'match_id': match.id,
            'compatibility_score': compat_score
        }

        if isinstance(compatibility_data, dict):
            response_data['similarity_score'] = compatibility_data['similarity_score']
            response_data['score_breakdown'] = compatibility_data['breakdown']

        return Response(response_data)

    return Response({'message': 'User liked successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_match(request):
    """Reject/pass on a user"""
    target_user_id = request.data.get('user_id')

    try:
        target_user = User.objects.get(id=target_user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    MatchInteraction.objects.get_or_create(
        user=request.user,
        target_user=target_user,
        defaults={'interaction_type': 'pass'}
    )

    return Response({'message': 'User passed'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_matches(request):
    """Get all matches for the current user"""
    user = request.user
    matches = Match.objects.filter(
        Q(user1=user) | Q(user2=user),
        status='mutual'
    ).order_by('-created_at')

    match_data = []
    for match in matches:
        other_user = match.user2 if match.user1 == user else match.user1
        other_user_data = UserSerializer(other_user).data

        # Determine if this is the primary match for the current user
        is_primary = match.is_primary_for_user1 if match.user1 == user else match.is_primary_for_user2

        match_data.append({
            'id': str(match.id),
            'user1Id': str(match.user1.id),
            'user2Id': str(match.user2.id),
            'compatibilityScore': match.compatibility_score,
            'status': match.status,
            'createdAt': match.created_at.isoformat(),
            'isPrimary': is_primary,
            'livingSpaceId': match.living_space_id,
            'otherUser': other_user_data
        })

    return Response(match_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_match_requests(request):
    """Get incoming match requests (people who liked you but you haven't responded to)"""
    user = request.user

    # Find users who have liked the current user but current user hasn't responded
    incoming_likes = MatchInteraction.objects.filter(
        target_user=user,
        interaction_type='like'
    )

    # Filter out users that current user has already responded to
    responded_users = MatchInteraction.objects.filter(
        user=user
    ).values_list('target_user_id', flat=True)

    pending_requests = incoming_likes.exclude(
        user_id__in=responded_users
    )

    request_data = []
    for interaction in pending_requests:
        requesting_user = interaction.user
        compatibility_data = calculate_compatibility(user, requesting_user)
        user_data = UserSerializer(requesting_user).data

        # Handle both old (int) and new (dict) return formats
        if isinstance(compatibility_data, dict):
            user_data['compatibility_score'] = compatibility_data['compatibility_score']
            user_data['similarity_score'] = compatibility_data['similarity_score']
            user_data['score_breakdown'] = compatibility_data['breakdown']
            compat_score = compatibility_data['compatibility_score']
        else:
            compat_score = compatibility_data

        request_data.append({
            'id': str(interaction.id),
            'requestingUser': user_data,
            'compatibilityScore': compat_score,
            'createdAt': interaction.created_at.isoformat(),
        })

    return Response(request_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_match_request(request):
    """Accept or decline a match request"""
    requester_user_id = request.data.get('user_id')
    response_type = request.data.get('response')  # 'accept' or 'decline'

    if response_type not in ['accept', 'decline']:
        return Response({'error': 'Invalid response type'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        requester_user = User.objects.get(id=requester_user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if the requester actually liked this user
    incoming_like = MatchInteraction.objects.filter(
        user=requester_user,
        target_user=request.user,
        interaction_type='like'
    ).first()

    if not incoming_like:
        return Response({'error': 'No match request found'}, status=status.HTTP_404_NOT_FOUND)

    if response_type == 'accept':
        # Create interaction for accepting
        interaction, created = MatchInteraction.objects.get_or_create(
            user=request.user,
            target_user=requester_user,
            defaults={'interaction_type': 'like'}
        )

        # Create match since both users liked each other
        compatibility_data = calculate_compatibility(request.user, requester_user)
        compat_score = compatibility_data['compatibility_score'] if isinstance(compatibility_data, dict) else compatibility_data

        match, created = Match.objects.get_or_create(
            user1=min(request.user, requester_user, key=lambda x: x.id),
            user2=max(request.user, requester_user, key=lambda x: x.id),
            defaults={
                'compatibility_score': compat_score,
                'status': 'mutual'
            }
        )

        response_data = {
            'message': 'Match request accepted!',
            'match_id': match.id,
            'compatibility_score': compat_score
        }

        if isinstance(compatibility_data, dict):
            response_data['similarity_score'] = compatibility_data['similarity_score']
            response_data['score_breakdown'] = compatibility_data['breakdown']

        return Response(response_data)

    else:  # decline
        # Create interaction for declining
        MatchInteraction.objects.get_or_create(
            user=request.user,
            target_user=requester_user,
            defaults={'interaction_type': 'pass'}
        )

        return Response({'message': 'Match request declined'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_compatibility(request, user_id):
    """Get compatibility score with specific user"""
    try:
        target_user = User.objects.get(id=user_id)
        compatibility_data = calculate_compatibility(request.user, target_user)

        # Handle both old (int) and new (dict) return formats
        if isinstance(compatibility_data, dict):
            return Response(compatibility_data)
        else:
            return Response({'compatibility_score': compatibility_data})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_primary_match(request, match_id):
    """Set a match as the primary match for the current user"""
    try:
        match = Match.objects.get(
            Q(id=match_id) & (Q(user1=request.user) | Q(user2=request.user)),
            status='mutual'
        )

        is_primary = request.data.get('is_primary', True)
        match.set_primary_for(request.user, is_primary)

        return Response({
            'message': 'Primary match updated successfully',
            'match_id': match.id,
            'is_primary': is_primary
        })
    except Match.DoesNotExist:
        return Response({'error': 'Match not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_shared_dashboard_info(request, match_id):
    """Get shared dashboard information for a specific match"""
    try:
        match = Match.objects.get(
            Q(id=match_id) & (Q(user1=request.user) | Q(user2=request.user)),
            status='mutual'
        )

        # Get or create living space
        living_space = match.get_or_create_living_space()

        other_user = match.other_user(request.user)
        other_user_data = UserSerializer(other_user).data

        return Response({
            'match_id': match.id,
            'living_space_id': living_space.id,
            'compatibility_score': match.compatibility_score,
            'is_primary': match.is_primary_for(request.user),
            'other_user': other_user_data,
            'created_at': match.created_at.isoformat(),
        })
    except Match.DoesNotExist:
        return Response({'error': 'Match not found'}, status=status.HTTP_404_NOT_FOUND)

def calculate_lifestyle_similarity(lifestyle1, lifestyle2):
    """Calculate similarity score based on lifestyle preferences (0-100)"""
    if not lifestyle1 or not lifestyle2:
        return 50  # Default middle score if data missing

    similarity_score = 0
    total_comparisons = 0

    # Helper function to compare values
    def compare_value(val1, val2, match_weight=100, partial_weight=50, mismatch_weight=0):
        if val1 == val2:
            return match_weight
        # For some comparisons, partial matches are possible
        return partial_weight if partial_weight else mismatch_weight

    # Daily routine compatibility
    if 'early_bird' in lifestyle1 and 'early_bird' in lifestyle2:
        similarity_score += compare_value(lifestyle1['early_bird'], lifestyle2['early_bird'], 100, 60, 30)
        total_comparisons += 1

    # Cooking frequency (compatible if both cook or both don't)
    if 'cooking_frequency' in lifestyle1 and 'cooking_frequency' in lifestyle2:
        cook_compatibility = {
            ('daily', 'few_times_week'): 90,
            ('daily', 'daily'): 100,
            ('few_times_week', 'few_times_week'): 100,
            ('rarely', 'never'): 80,
        }
        key = (lifestyle1['cooking_frequency'], lifestyle2['cooking_frequency'])
        similarity_score += cook_compatibility.get(key, cook_compatibility.get((key[1], key[0]), 50))
        total_comparisons += 1

    # Hosting visitors frequency
    if 'hosting_visitors' in lifestyle1 and 'hosting_visitors' in lifestyle2:
        visitor_map = {'frequently': 100, 'occasionally': 75, 'rarely': 50, 'never': 25}
        diff = abs(visitor_map.get(lifestyle1['hosting_visitors'], 50) - visitor_map.get(lifestyle2['hosting_visitors'], 50))
        similarity_score += max(0, 100 - diff)
        total_comparisons += 1

    # Smoking/drinking - critical compatibility factor
    if 'smoking_drinking' in lifestyle1 and 'smoking_drinking' in lifestyle2:
        if lifestyle1['smoking_drinking'] == lifestyle2['smoking_drinking']:
            similarity_score += 100
        elif 'neither' in [lifestyle1['smoking_drinking'], lifestyle2['smoking_drinking']]:
            # Neither person wants smoking/drinking - partial mismatch
            similarity_score += 40
        else:
            similarity_score += 60  # Partial compatibility
        total_comparisons += 1

    # Noise preference - important for living comfort
    if 'noise_preference' in lifestyle1 and 'noise_preference' in lifestyle2:
        noise_map = {'very_quiet': 100, 'moderate': 50, 'dont_mind': 0}
        diff = abs(noise_map.get(lifestyle1['noise_preference'], 50) - noise_map.get(lifestyle2['noise_preference'], 50))
        similarity_score += max(0, 100 - diff)
        total_comparisons += 1

    # Chore frequency
    if 'chore_frequency' in lifestyle1 and 'chore_frequency' in lifestyle2:
        similarity_score += compare_value(lifestyle1['chore_frequency'], lifestyle2['chore_frequency'], 100, 70, 40)
        total_comparisons += 1

    # Sharing items preference
    if 'sharing_items' in lifestyle1 and 'sharing_items' in lifestyle2:
        similarity_score += compare_value(lifestyle1['sharing_items'], lifestyle2['sharing_items'], 100, 65, 30)
        total_comparisons += 1

    # Financial compatibility
    if 'bill_splitting' in lifestyle1 and 'bill_splitting' in lifestyle2:
        similarity_score += compare_value(lifestyle1['bill_splitting'], lifestyle2['bill_splitting'], 100, 70, 50)
        total_comparisons += 1

    if 'cost_sharing' in lifestyle1 and 'cost_sharing' in lifestyle2:
        similarity_score += compare_value(lifestyle1['cost_sharing'], lifestyle2['cost_sharing'], 100, 65, 40)
        total_comparisons += 1

    if 'bill_payment' in lifestyle1 and 'bill_payment' in lifestyle2:
        # Bill payment strictness - very important
        if lifestyle1['bill_payment'] == lifestyle2['bill_payment']:
            similarity_score += 100
        elif 'very_strict' in [lifestyle1['bill_payment'], lifestyle2['bill_payment']]:
            similarity_score += 50  # Strict person might have issues with flexible person
        else:
            similarity_score += 75
        total_comparisons += 1

    # Social compatibility
    if 'roommate_relationship' in lifestyle1 and 'roommate_relationship' in lifestyle2:
        similarity_score += compare_value(lifestyle1['roommate_relationship'], lifestyle2['roommate_relationship'], 100, 60, 30)
        total_comparisons += 1

    if 'group_activities' in lifestyle1 and 'group_activities' in lifestyle2:
        activity_map = {'love_it': 100, 'occasionally': 60, 'rarely': 30, 'prefer_not': 0}
        diff = abs(activity_map.get(lifestyle1['group_activities'], 50) - activity_map.get(lifestyle2['group_activities'], 50))
        similarity_score += max(0, 100 - diff)
        total_comparisons += 1

    # Gender preference - can be dealbreaker
    if 'gender_preference' in lifestyle1 and 'gender_preference' in lifestyle2:
        if lifestyle1['gender_preference'] == 'any_gender' and lifestyle2['gender_preference'] == 'any_gender':
            similarity_score += 100
        elif 'any_gender' in [lifestyle1['gender_preference'], lifestyle2['gender_preference']]:
            similarity_score += 75
        else:
            similarity_score += compare_value(lifestyle1['gender_preference'], lifestyle2['gender_preference'], 100, 50, 20)
        total_comparisons += 1

    # Pet compatibility
    if 'pets' in lifestyle1 and 'pets' in lifestyle2:
        pet_scores = {
            ('have_pets', 'love_pets'): 95,
            ('have_pets', 'okay_with_pets'): 85,
            ('have_pets', 'no_pets'): 30,
            ('have_pets', 'allergic'): 20,
            ('love_pets', 'okay_with_pets'): 90,
            ('okay_with_pets', 'no_pets'): 50,
            ('allergic', 'have_pets'): 25,
            ('no_pets', 'have_pets'): 30,
        }
        key = (lifestyle1['pets'], lifestyle2['pets'])
        similarity_score += pet_scores.get(key, pet_scores.get((key[1], key[0]), 70))
        total_comparisons += 1

    # Allergies compatibility
    if 'allergies' in lifestyle1 and 'allergies' in lifestyle2:
        if lifestyle1['allergies'] == 'none' and lifestyle2['allergies'] == 'none':
            similarity_score += 100
        elif 'none' in [lifestyle1['allergies'], lifestyle2['allergies']]:
            similarity_score += 80
        else:
            similarity_score += 60
        total_comparisons += 1

    # Ideal personality match
    if 'ideal_personality' in lifestyle1 and 'ideal_personality' in lifestyle2:
        similarity_score += compare_value(lifestyle1['ideal_personality'], lifestyle2['ideal_personality'], 100, 65, 40)
        total_comparisons += 1

    return round(similarity_score / total_comparisons) if total_comparisons > 0 else 50


def calculate_compatibility(user1, user2):
    """
    Calculate comprehensive compatibility score between two users.
    Returns both similarity score (how alike they are) and compatibility score (how well they'd live together)
    """
    try:
        profile1 = user1.personality_profile
        profile2 = user2.personality_profile
    except PersonalityProfile.DoesNotExist:
        return 0

    # 1. Lifestyle Similarity Score (50% weight) - Based on detailed lifestyle data
    lifestyle1 = profile1.lifestyle_data or {}
    lifestyle2 = profile2.lifestyle_data or {}
    lifestyle_similarity = calculate_lifestyle_similarity(lifestyle1, lifestyle2)

    # 2. Basic Lifestyle Preferences (15% weight)
    basic_lifestyle_score = 0
    basic_lifestyle_score += max(0, 100 - abs(profile1.cleanliness_level - profile2.cleanliness_level) * 1.5)
    basic_lifestyle_score += max(0, 100 - abs(profile1.social_level - profile2.social_level) * 1.5)
    basic_lifestyle_score += 100 if profile1.quiet_hours == profile2.quiet_hours else 50
    basic_lifestyle_score += 100 if profile1.pets_allowed == profile2.pets_allowed else 30
    basic_lifestyle_score += 100 if profile1.smoking_allowed == profile2.smoking_allowed else 20
    basic_lifestyle_score = basic_lifestyle_score / 5

    # 3. Personality Traits (20% weight) - Reduced from 40%
    traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
    personality_score = 0

    for trait in traits:
        val1 = getattr(profile1, trait, 50)
        val2 = getattr(profile2, trait, 50)
        diff = abs(val1 - val2)
        trait_score = max(0, 100 - (diff * 1.5))
        personality_score += trait_score

    personality_score = personality_score / len(traits)

    # 4. Communication Style (10% weight)
    communication_score = 90 if profile1.communication_style == profile2.communication_style else 60

    # 5. Location Compatibility (5% weight)
    location_score = 100  # Default, can be enhanced with actual location data
    if hasattr(user1, 'preferred_city') and hasattr(user2, 'preferred_city'):
        if user1.preferred_city and user2.preferred_city:
            location_score = 100 if user1.preferred_city.lower() == user2.preferred_city.lower() else 60

    # Calculate final weighted scores
    compatibility_score = (
        lifestyle_similarity * 0.50 +
        basic_lifestyle_score * 0.15 +
        personality_score * 0.20 +
        communication_score * 0.10 +
        location_score * 0.05
    )

    # Calculate pure similarity score (how similar they are, not necessarily compatible)
    similarity_score = (
        lifestyle_similarity * 0.60 +
        personality_score * 0.30 +
        basic_lifestyle_score * 0.10
    )

    # Store both scores in the user data (for API response)
    return {
        'compatibility_score': round(compatibility_score),
        'similarity_score': round(similarity_score),
        'breakdown': {
            'lifestyle': round(lifestyle_similarity),
            'basic_lifestyle': round(basic_lifestyle_score),
            'personality': round(personality_score),
            'communication': round(communication_score),
            'location': round(location_score)
        }
    }

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unmatch(request, match_id):
    """Delete/unmatch from a match"""
    try:
        # Get the match
        match = Match.objects.get(
            Q(id=match_id) & (Q(user1=request.user) | Q(user2=request.user))
        )

        # Check if there's a shared living space
        if match.living_space:
            return Response(
                {'error': 'Cannot unmatch while you have a shared living space. Please leave the space first or delete it.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete the match
        match.delete()

        # Also delete the match interaction if it exists
        MatchInteraction.objects.filter(
            Q(user=request.user) & Q(target_user__in=[match.user1, match.user2])
        ).delete()

        return Response({'message': 'Successfully unmatched'}, status=status.HTTP_200_OK)

    except Match.DoesNotExist:
        return Response({'error': 'Match not found'}, status=status.HTTP_404_NOT_FOUND)
