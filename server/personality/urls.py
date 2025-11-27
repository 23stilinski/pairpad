from django.urls import path
from . import views

urlpatterns = [
    path('assessment/', views.AssessmentQuestionsView.as_view(), name='assessment_questions'),
    path('submit/', views.submit_assessment, name='submit_assessment'),
    path('profile/', views.PersonalityProfileView.as_view(), name='personality_profile'),
]