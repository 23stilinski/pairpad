from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.conversation_list, name='conversation_list'),
    path('<int:match_id>/', views.get_or_create_conversation, name='get_conversation'),
    path('send/', views.send_message, name='send_message'),
]