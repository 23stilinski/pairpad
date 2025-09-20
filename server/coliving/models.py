from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal

User = get_user_model()

class LivingSpace(models.Model):
    SPACE_TYPES = [
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('condo', 'Condo'),
        ('dorm', 'Dormitory'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=100)
    space_type = models.CharField(max_length=20, choices=SPACE_TYPES, default='apartment')
    description = models.TextField(blank=True, help_text="Describe your living space")

    # Location details
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    country = models.CharField(max_length=50, default='United States')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Property details
    total_bedrooms = models.IntegerField(default=1)
    total_bathrooms = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    total_rent = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    utilities_included = models.BooleanField(default=False)
    furnished = models.BooleanField(default=False)
    parking_available = models.BooleanField(default=False)

    # Availability
    available_from = models.DateField(null=True, blank=True)
    lease_duration_months = models.IntegerField(null=True, blank=True, help_text="Lease duration in months")

    # Members of this living space
    members = models.ManyToManyField(User, through='LivingSpaceMember', related_name='living_spaces')

    # Created by the first member
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_spaces')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True, help_text="Allow others to discover this space")

    def __str__(self):
        return f"{self.name} ({self.space_type})"

    def get_available_rooms(self):
        """Return rooms that are available for rent"""
        return self.rooms.filter(is_available=True)

    def get_monthly_rent_per_person(self):
        """Calculate estimated monthly rent per person"""
        if self.total_rent and self.total_bedrooms:
            return self.total_rent / self.total_bedrooms
        return None

    class Meta:
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['is_active']),
            models.Index(fields=['city', 'is_public']),
            models.Index(fields=['available_from']),
        ]

class LivingSpaceMember(models.Model):
    MEMBER_ROLES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
        ('guest', 'Guest'),
    ]

    living_space = models.ForeignKey(LivingSpace, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='space_memberships')
    role = models.CharField(max_length=20, choices=MEMBER_ROLES, default='member')

    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['living_space', 'user']

    def __str__(self):
        return f"{self.user.username} in {self.living_space.name} ({self.role})"

class Task(models.Model):
    TASK_CATEGORIES = [
        ('cleaning', 'Cleaning'),
        ('maintenance', 'Maintenance'),
        ('groceries', 'Groceries'),
        ('bills', 'Bills'),
        ('other', 'Other'),
    ]

    TASK_STATUS = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    ]

    RECURRENCE_TYPES = [
        ('none', 'One-time'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    living_space = models.ForeignKey(LivingSpace, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=TASK_CATEGORIES, default='other')

    # Assignment
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')

    # Scheduling
    due_date = models.DateTimeField(null=True, blank=True)
    recurrence = models.CharField(max_length=20, choices=RECURRENCE_TYPES, default='none')

    # Status
    status = models.CharField(max_length=20, choices=TASK_STATUS, default='pending')
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', 'created_at']
        indexes = [
            models.Index(fields=['living_space', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"{self.title} - {self.living_space.name}"

class Expense(models.Model):
    EXPENSE_CATEGORIES = [
        ('rent', 'Rent'),
        ('utilities', 'Utilities'),
        ('groceries', 'Groceries'),
        ('supplies', 'Supplies'),
        ('maintenance', 'Maintenance'),
        ('internet', 'Internet'),
        ('other', 'Other'),
    ]

    SPLIT_TYPES = [
        ('equal', 'Split Equally'),
        ('custom', 'Custom Split'),
        ('percentage', 'Percentage Split'),
    ]

    living_space = models.ForeignKey(LivingSpace, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=EXPENSE_CATEGORIES, default='other')

    # Amount and payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    paid_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='paid_expenses')

    # Split configuration
    split_type = models.CharField(max_length=20, choices=SPLIT_TYPES, default='equal')
    participants = models.ManyToManyField(User, through='ExpenseSplit', related_name='shared_expenses')

    # Receipt/proof
    receipt_image = models.ImageField(upload_to='expense_receipts/', blank=True, null=True)

    # Dates
    expense_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-expense_date']
        indexes = [
            models.Index(fields=['living_space', 'expense_date']),
            models.Index(fields=['paid_by', 'expense_date']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"{self.title} - ${self.amount} ({self.living_space.name})"

class ExpenseSplit(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='splits')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expense_splits')

    # Amount this user owes for this expense
    amount_owed = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])

    # Payment tracking
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    paid_at = models.DateTimeField(null=True, blank=True)
    is_settled = models.BooleanField(default=False)

    class Meta:
        unique_together = ['expense', 'user']

    def __str__(self):
        return f"{self.user.username} owes ${self.amount_owed} for {self.expense.title}"

    @property
    def remaining_amount(self):
        return self.amount_owed - self.amount_paid

class HouseRules(models.Model):
    living_space = models.OneToOneField(LivingSpace, on_delete=models.CASCADE, related_name='house_rules')

    # Quiet hours
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)

    # Guest policies
    overnight_guests_allowed = models.BooleanField(default=True)
    max_consecutive_guest_nights = models.IntegerField(default=3)
    guest_notification_required = models.BooleanField(default=True)

    # Cleaning policies
    cleaning_schedule = models.TextField(blank=True)
    shared_chores_rotation = models.BooleanField(default=True)

    # Other rules
    smoking_allowed = models.BooleanField(default=False)
    pets_allowed = models.BooleanField(default=False)
    alcohol_allowed = models.BooleanField(default=True)

    # Custom rules
    custom_rules = models.TextField(blank=True, help_text="Additional house rules")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"House Rules for {self.living_space.name}"

    class Meta:
        verbose_name = "House Rules"
        verbose_name_plural = "House Rules"

class Room(models.Model):
    ROOM_TYPES = [
        ('bedroom', 'Bedroom'),
        ('shared_bedroom', 'Shared Bedroom'),
        ('studio', 'Studio'),
        ('master_bedroom', 'Master Bedroom'),
    ]

    living_space = models.ForeignKey(LivingSpace, on_delete=models.CASCADE, related_name='rooms')
    name = models.CharField(max_length=100, help_text="Room name or number")
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='bedroom')
    description = models.TextField(blank=True)

    # Room details
    size_sqft = models.IntegerField(null=True, blank=True, help_text="Room size in square feet")
    has_private_bathroom = models.BooleanField(default=False)
    has_balcony = models.BooleanField(default=False)
    has_closet = models.BooleanField(default=True)
    furnished = models.BooleanField(default=False)
    air_conditioning = models.BooleanField(default=False)

    # Availability and pricing
    is_available = models.BooleanField(default=True)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    available_from = models.DateField(null=True, blank=True)

    # Current occupant (if any)
    current_occupant = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='occupied_rooms'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} in {self.living_space.name}"

    def calculate_compatibility_score(self, user):
        """Calculate compatibility score between user and current occupants"""
        if not hasattr(user, 'personality_profile') or not user.personality_profile:
            return 0

        scores = []

        # Check compatibility with space creator
        creator = self.living_space.created_by
        if creator != user and hasattr(creator, 'personality_profile'):
            from authentication.models import User
            from matching.views import calculate_compatibility
            score = calculate_compatibility(user, creator)
            scores.append(score)

        # Check compatibility with current room occupant
        if self.current_occupant and self.current_occupant != user:
            if hasattr(self.current_occupant, 'personality_profile'):
                score = calculate_compatibility(user, self.current_occupant)
                scores.append(score)

        # Check compatibility with other space members
        for member in self.living_space.members.exclude(id=user.id):
            if hasattr(member, 'personality_profile'):
                score = calculate_compatibility(user, member)
                scores.append(score)

        return sum(scores) / len(scores) if scores else 50  # Default 50% if no comparisons

    class Meta:
        indexes = [
            models.Index(fields=['living_space', 'is_available']),
            models.Index(fields=['available_from']),
        ]

class LivingSpaceImage(models.Model):
    IMAGE_TYPES = [
        ('exterior', 'Exterior'),
        ('living_room', 'Living Room'),
        ('kitchen', 'Kitchen'),
        ('bathroom', 'Bathroom'),
        ('bedroom', 'Bedroom'),
        ('amenity', 'Amenity'),
        ('other', 'Other'),
    ]

    living_space = models.ForeignKey(LivingSpace, on_delete=models.CASCADE, related_name='images')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=True, blank=True, related_name='images')

    image = models.ImageField(upload_to='living_spaces/', help_text="Upload space photos")
    image_type = models.CharField(max_length=20, choices=IMAGE_TYPES, default='other')
    caption = models.CharField(max_length=200, blank=True)

    is_primary = models.BooleanField(default=False, help_text="Main photo for this space")
    order = models.IntegerField(default=0, help_text="Display order")

    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_space_images')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.living_space.name} ({self.image_type})"

    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['living_space', 'is_primary']),
            models.Index(fields=['room']),
        ]

class RoomApplication(models.Model):
    APPLICATION_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_applications')

    # Application details
    message = models.TextField(help_text="Why do you want to live here?")
    move_in_date = models.DateField()
    lease_duration_months = models.IntegerField(help_text="Desired lease duration in months")

    # Status and review
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS, default='pending')
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_applications'
    )
    review_message = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.applicant.username} -> {self.room.name}"

    class Meta:
        unique_together = ['room', 'applicant']
        indexes = [
            models.Index(fields=['room', 'status']),
            models.Index(fields=['applicant', 'status']),
            models.Index(fields=['created_at']),
        ]

class LivingSpaceReview(models.Model):
    living_space = models.ForeignKey(LivingSpace, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='space_reviews')

    # Ratings (1-5 scale)
    overall_rating = models.IntegerField(help_text="Overall rating (1-5)")
    cleanliness_rating = models.IntegerField(help_text="Cleanliness rating (1-5)")
    location_rating = models.IntegerField(help_text="Location rating (1-5)")
    value_rating = models.IntegerField(help_text="Value for money (1-5)")
    roommate_compatibility = models.IntegerField(help_text="Roommate compatibility (1-5)")

    # Review text
    review_text = models.TextField(help_text="Detailed review")
    pros = models.TextField(blank=True, help_text="What you liked")
    cons = models.TextField(blank=True, help_text="What could be improved")

    # Verification
    verified_stay = models.BooleanField(default=False, help_text="Reviewer actually lived here")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Review by {self.reviewer.username} for {self.living_space.name}"

    class Meta:
        unique_together = ['living_space', 'reviewer']
        indexes = [
            models.Index(fields=['living_space', 'overall_rating']),
            models.Index(fields=['created_at']),
        ]
