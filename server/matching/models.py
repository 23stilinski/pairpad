from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()

class Match(models.Model):
    MATCH_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('mutual', 'Mutual Match'),
    ]

    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_user2')
    compatibility_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    status = models.CharField(max_length=20, choices=MATCH_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user1', 'user2']
        indexes = [
            models.Index(fields=['user1', 'status']),
            models.Index(fields=['user2', 'status']),
            models.Index(fields=['compatibility_score']),
        ]

    def __str__(self):
        return f"Match between {self.user1.username} and {self.user2.username} ({self.compatibility_score}%)"

    @property
    def other_user(self, current_user):
        return self.user2 if self.user1 == current_user else self.user1

class MatchInteraction(models.Model):
    INTERACTION_TYPES = [
        ('like', 'Like'),
        ('pass', 'Pass'),
        ('super_like', 'Super Like'),
        ('block', 'Block'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='match_interactions')
    target_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_interactions')
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'target_user']
        indexes = [
            models.Index(fields=['user', 'interaction_type']),
            models.Index(fields=['target_user', 'interaction_type']),
        ]

    def __str__(self):
        return f"{self.user.username} {self.interaction_type} {self.target_user.username}"

class CompatibilityScore(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='compatibility_scores_as_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='compatibility_scores_as_user2')

    # Detailed compatibility breakdown
    personality_score = models.FloatField(default=0.0)
    lifestyle_score = models.FloatField(default=0.0)
    communication_score = models.FloatField(default=0.0)
    location_score = models.FloatField(default=100.0)  # Default full score if no location data

    overall_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )

    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user1', 'user2']
        indexes = [
            models.Index(fields=['overall_score']),
            models.Index(fields=['user1', 'overall_score']),
            models.Index(fields=['user2', 'overall_score']),
        ]

    def __str__(self):
        return f"Compatibility: {self.user1.username} & {self.user2.username} ({self.overall_score}%)"

class UserPreferences(models.Model):
    GENDER_CHOICES = [
        ('any', 'Any'),
        ('male', 'Male'),
        ('female', 'Female'),
        ('non_binary', 'Non-binary'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='match_preferences')

    # Age preferences
    min_age = models.IntegerField(default=18)
    max_age = models.IntegerField(default=65)

    # Gender preferences
    preferred_gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='any')

    # Location preferences
    max_distance_km = models.IntegerField(default=50)  # Maximum distance in kilometers

    # Lifestyle preferences for matching
    smoking_preference = models.CharField(
        max_length=20,
        choices=[
            ('any', 'Any'),
            ('smoker', 'Smoker'),
            ('non_smoker', 'Non-smoker'),
        ],
        default='any'
    )

    pets_preference = models.CharField(
        max_length=20,
        choices=[
            ('any', 'Any'),
            ('has_pets', 'Has Pets'),
            ('no_pets', 'No Pets'),
        ],
        default='any'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.username}"
