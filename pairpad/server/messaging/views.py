from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from matching.models import Match

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_list(request):
    """Get all conversations for the current user"""
    conversations = request.user.conversations.all()
    conversation_data = []

    for conv in conversations:
        last_msg = conv.last_message
        conversation_data.append({
            'id': conv.id,
            'match_id': conv.match.id if conv.match else None,
            'last_message': {
                'content': last_msg.content if last_msg else None,
                'timestamp': last_msg.created_at if last_msg else None,
                'sender': last_msg.sender.username if last_msg else None,
            } if last_msg else None,
            'participants': [p.username for p in conv.participants.all()],
            'updated_at': conv.updated_at,
        })

    return Response(conversation_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_or_create_conversation(request, match_id):
    """Get or create conversation for a match"""
    try:
        match = Match.objects.get(id=match_id)
        if request.user not in [match.user1, match.user2]:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        conversation, created = Conversation.objects.get_or_create(match=match)

        if created:
            conversation.participants.add(match.user1, match.user2)

        messages = conversation.messages.all()
        message_data = [{
            'id': msg.id,
            'sender': msg.sender.username,
            'content': msg.content,
            'timestamp': msg.created_at,
        } for msg in messages]

        return Response({
            'conversation_id': conversation.id,
            'messages': message_data
        })

    except Match.DoesNotExist:
        return Response({'error': 'Match not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Send a message"""
    match_id = request.data.get('match_id')
    content = request.data.get('content')

    try:
        match = Match.objects.get(id=match_id)
        if request.user not in [match.user1, match.user2]:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        conversation = Conversation.objects.get(match=match)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )

        return Response({
            'id': message.id,
            'sender': message.sender.username,
            'content': message.content,
            'timestamp': message.created_at,
        })

    except (Match.DoesNotExist, Conversation.DoesNotExist):
        return Response({'error': 'Match or conversation not found'}, status=status.HTTP_404_NOT_FOUND)
