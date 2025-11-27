from rest_framework import serializers
from .models import PersonalityProfile, AssessmentQuestion, AssessmentResponse


class CleanlinessField(serializers.Field):
    """Custom field that accepts both string choices and integer values for cleanliness level"""

    def to_internal_value(self, data):
        if isinstance(data, str):
            cleanliness_map = {
                'very_messy': 25,
                'somewhat_messy': 40,
                'moderately_tidy': 60,
                'very_tidy': 85
            }
            return cleanliness_map.get(data, 50)
        elif isinstance(data, int):
            return max(0, min(100, data))  # Clamp to 0-100
        elif data is None:
            return 50
        else:
            raise serializers.ValidationError("Invalid cleanliness level value")

    def to_representation(self, value):
        return value

class PersonalityProfileSerializer(serializers.ModelSerializer):
    lifestylePreferences = serializers.SerializerMethodField()
    communicationStyle = serializers.CharField(source='communication_style', read_only=True)

    class Meta:
        model = PersonalityProfile
        fields = [
            'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism',
            'lifestylePreferences', 'communicationStyle'
        ]

    def get_lifestylePreferences(self, obj):
        return {
            'cleanliness': obj.cleanliness_level,
            'socialLevel': obj.social_level,
            'quietHours': obj.quiet_hours,
            'pets': obj.pets_allowed,
            'smoking': obj.smoking_allowed
        }

class AssessmentQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        fields = [
            'id', 'question_text', 'trait', 'question_type', 'reverse_scored', 'order'
        ]

class AssessmentResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentResponse
        fields = ['question', 'response_value', 'response_boolean', 'response_text']

    def validate(self, attrs):
        question = attrs['question']

        if question.question_type == 'scale':
            if attrs.get('response_value') is None or not (1 <= attrs['response_value'] <= 5):
                raise serializers.ValidationError("Scale questions require a response value between 1 and 5")

        elif question.question_type == 'boolean':
            if attrs.get('response_boolean') is None:
                raise serializers.ValidationError("Boolean questions require a true/false response")

        return attrs

class PersonalityAssessmentSubmissionSerializer(serializers.Serializer):
    responses = AssessmentResponseSerializer(many=True, required=False)

    # Direct personality trait scores (0-100)
    openness = serializers.IntegerField(required=False, min_value=0, max_value=100)
    conscientiousness = serializers.IntegerField(required=False, min_value=0, max_value=100)
    extraversion = serializers.IntegerField(required=False, min_value=0, max_value=100)
    agreeableness = serializers.IntegerField(required=False, min_value=0, max_value=100)
    neuroticism = serializers.IntegerField(required=False, min_value=0, max_value=100)

    # Lifestyle preferences
    cleanliness_level = CleanlinessField(required=False)
    social_level = serializers.IntegerField(required=False, min_value=0, max_value=100)
    quiet_hours = serializers.BooleanField(required=False)
    pets_allowed = serializers.BooleanField(required=False)
    smoking_allowed = serializers.BooleanField(required=False)

    # Communication style
    communication_style = serializers.ChoiceField(
        choices=PersonalityProfile.COMMUNICATION_STYLES,
        default='diplomatic'
    )

    # All lifestyle data as JSON
    lifestyle_data = serializers.JSONField(required=False)
    lifestyle_preferences = serializers.DictField(required=False)  # Backward compatibility

    def validate(self, attrs):
        # Accept either responses or direct scores
        has_responses = attrs.get('responses')
        has_direct_scores = any(k in attrs for k in ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'])

        if not has_responses and not has_direct_scores:
            raise serializers.ValidationError("Either responses or direct personality scores are required")

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        responses = validated_data.get('responses', [])
        lifestyle_prefs = validated_data.get('lifestyle_preferences', {})
        communication_style = validated_data.get('communication_style', 'diplomatic')
        lifestyle_data = validated_data.get('lifestyle_data', {})

        # Get cleanliness level (already converted by CleanlinessField)
        cleanliness_value = validated_data.get('cleanliness_level', lifestyle_prefs.get('cleanliness', 50))

        # Calculate personality scores - use direct scores if provided, otherwise calculate from responses
        if any(k in validated_data for k in ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']):
            trait_scores = {
                'openness': validated_data.get('openness', 50),
                'conscientiousness': validated_data.get('conscientiousness', 50),
                'extraversion': validated_data.get('extraversion', 50),
                'agreeableness': validated_data.get('agreeableness', 50),
                'neuroticism': validated_data.get('neuroticism', 50),
            }
        else:
            trait_scores = self.calculate_personality_scores(responses)

        # Create or update personality profile
        profile, created = PersonalityProfile.objects.get_or_create(
            user=user,
            defaults={
                **trait_scores,
                'cleanliness_level': cleanliness_value,
                'social_level': validated_data.get('social_level', lifestyle_prefs.get('socialLevel', 50)),
                'quiet_hours': validated_data.get('quiet_hours', lifestyle_prefs.get('quietHours', False)),
                'pets_allowed': validated_data.get('pets_allowed', lifestyle_prefs.get('pets', False)),
                'smoking_allowed': validated_data.get('smoking_allowed', lifestyle_prefs.get('smoking', False)),
                'communication_style': communication_style,
                'lifestyle_data': lifestyle_data,
            }
        )

        if not created:
            # Update existing profile
            for field, value in trait_scores.items():
                setattr(profile, field, value)

            profile.cleanliness_level = cleanliness_value
            profile.social_level = validated_data.get('social_level', lifestyle_prefs.get('socialLevel', profile.social_level))
            profile.quiet_hours = validated_data.get('quiet_hours', lifestyle_prefs.get('quietHours', profile.quiet_hours))
            profile.pets_allowed = validated_data.get('pets_allowed', lifestyle_prefs.get('pets', profile.pets_allowed))
            profile.smoking_allowed = validated_data.get('smoking_allowed', lifestyle_prefs.get('smoking', profile.smoking_allowed))
            profile.communication_style = communication_style
            profile.lifestyle_data = lifestyle_data
            profile.save()

        # Save individual responses
        AssessmentResponse.objects.filter(user=user).delete()  # Clear old responses

        response_objects = []
        for response_data in responses:
            response_objects.append(AssessmentResponse(
                user=user,
                question_id=response_data['question'].id if hasattr(response_data['question'], 'id') else response_data['question'],
                response_value=response_data.get('response_value', 0),
                response_boolean=response_data.get('response_boolean'),
                response_text=response_data.get('response_text', '')
            ))

        AssessmentResponse.objects.bulk_create(response_objects)

        return profile

    def calculate_personality_scores(self, responses):
        trait_totals = {
            'openness': [],
            'conscientiousness': [],
            'extraversion': [],
            'agreeableness': [],
            'neuroticism': []
        }

        for response_data in responses:
            question_id = response_data['question'].id if hasattr(response_data['question'], 'id') else response_data['question']

            try:
                question = AssessmentQuestion.objects.get(id=question_id)
                if question.trait in trait_totals:
                    score = response_data.get('response_value', 0)

                    # Apply reverse scoring if needed
                    if question.reverse_scored:
                        score = 6 - score

                    trait_totals[question.trait].append(score)
            except AssessmentQuestion.DoesNotExist:
                continue

        # Calculate averages and convert to 0-100 scale
        trait_scores = {}
        for trait, scores in trait_totals.items():
            if scores:
                avg_score = sum(scores) / len(scores)
                trait_scores[trait] = min(100, max(0, int((avg_score - 1) * 25)))  # Convert 1-5 scale to 0-100
            else:
                trait_scores[trait] = 50  # Default middle value

        return trait_scores