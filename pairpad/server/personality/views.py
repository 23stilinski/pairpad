from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from authentication.models import OnboardingProgress

from .models import PersonalityProfile, AssessmentQuestion
from .serializers import (
    PersonalityProfileSerializer,
    AssessmentQuestionSerializer,
    PersonalityAssessmentSubmissionSerializer
)

User = get_user_model()

class AssessmentQuestionsView(generics.ListAPIView):
    """Get all active assessment questions"""
    queryset = AssessmentQuestion.objects.filter(is_active=True)
    serializer_class = AssessmentQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_assessment(request):
    """Submit personality assessment responses"""
    serializer = PersonalityAssessmentSubmissionSerializer(
        data=request.data,
        context={'request': request}
    )

    if serializer.is_valid():
        profile = serializer.save()

        # Mark assessment as completed in onboarding progress
        try:
            onboarding_progress = request.user.onboarding_progress
            onboarding_progress.mark_step_complete(OnboardingProgress.STEP_ASSESSMENT_DONE)
        except OnboardingProgress.DoesNotExist:
            pass

        return Response({
            'message': 'Assessment completed successfully',
            'profile': PersonalityProfileSerializer(profile).data
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PersonalityProfileView(generics.RetrieveUpdateAPIView):
    """Get or update user's personality profile"""
    serializer_class = PersonalityProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = PersonalityProfile.objects.get_or_create(user=self.request.user)
        return profile
