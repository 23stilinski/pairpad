from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.UserRegistrationView.as_view(), name='user_register'),
    path('logout/', views.logout_view, name='logout'),
    path('verify/', views.verify_token_view, name='verify_token'),

    # User profile endpoints
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('users/<int:pk>/', views.PublicUserProfileView.as_view(), name='public_user_profile'),

    # Onboarding progress endpoints
    path('onboarding/progress/', views.get_onboarding_progress, name='get_onboarding_progress'),
    path('onboarding/progress/update/', views.update_onboarding_progress, name='update_onboarding_progress'),
]