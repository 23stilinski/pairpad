from django.urls import path
from . import views

urlpatterns = [
    path('suggestions/', views.get_match_suggestions, name='match_suggestions'),
    path('accept/', views.accept_match, name='accept_match'),
    path('reject/', views.reject_match, name='reject_match'),
    path('matches/', views.get_user_matches, name='get_user_matches'),
    path('requests/', views.get_match_requests, name='get_match_requests'),
    path('respond/', views.respond_to_match_request, name='respond_to_match_request'),
    path('compatibility/<int:user_id>/', views.get_compatibility, name='get_compatibility'),
    path('<int:match_id>/set-primary/', views.set_primary_match, name='set_primary_match'),
    path('<int:match_id>/dashboard-info/', views.get_shared_dashboard_info, name='get_shared_dashboard_info'),
    path('<int:match_id>/unmatch/', views.unmatch, name='unmatch'),
]