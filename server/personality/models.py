from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class PersonalityProfile(models.Model):
    COMMUNICATION_STYLES = [
        ('direct', 'Direct'),
        ('diplomatic', 'Diplomatic'),
        ('casual', 'Casual'),
        ('formal', 'Formal'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='personality_profile')

    # Big Five Personality Traits (0-100 scale)
    openness = models.IntegerField(default=50)
    conscientiousness = models.IntegerField(default=50)
    extraversion = models.IntegerField(default=50)
    agreeableness = models.IntegerField(default=50)
    neuroticism = models.IntegerField(default=50)

    # Lifestyle Preferences
    cleanliness_level = models.IntegerField(default=50)  # 0-100 scale
    social_level = models.IntegerField(default=50)       # 0-100 scale
    quiet_hours = models.BooleanField(default=False)
    pets_allowed = models.BooleanField(default=False)
    smoking_allowed = models.BooleanField(default=False)

    # Communication Style
    communication_style = models.CharField(
        max_length=20,
        choices=COMMUNICATION_STYLES,
        default='diplomatic'
    )

    # Complete lifestyle data as JSON
    lifestyle_data = models.JSONField(default=dict, blank=True)

    # Assessment metadata
    completed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Personality Profile for {self.user.username}"

    class Meta:
        verbose_name = "Personality Profile"
        verbose_name_plural = "Personality Profiles"

class AssessmentQuestion(models.Model):
    TRAIT_CHOICES = [
        ('openness', 'Openness'),
        ('conscientiousness', 'Conscientiousness'),
        ('extraversion', 'Extraversion'),
        ('agreeableness', 'Agreeableness'),
        ('neuroticism', 'Neuroticism'),
        ('lifestyle', 'Lifestyle'),
    ]

    QUESTION_TYPES = [
        ('scale', '1-5 Scale'),
        ('boolean', 'Yes/No'),
        ('choice', 'Multiple Choice'),
    ]

    question_text = models.TextField()
    trait = models.CharField(max_length=20, choices=TRAIT_CHOICES)
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES)
    reverse_scored = models.BooleanField(default=False)
    order = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}..."

class AssessmentResponse(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessment_responses')
    question = models.ForeignKey(AssessmentQuestion, on_delete=models.CASCADE)
    response_value = models.IntegerField()  # For scale questions (1-5)
    response_boolean = models.BooleanField(null=True, blank=True)  # For yes/no questions
    response_text = models.CharField(max_length=100, blank=True)  # For text responses
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'question']

    def __str__(self):
        return f"{self.user.username} - {self.question.question_text[:30]}..."
