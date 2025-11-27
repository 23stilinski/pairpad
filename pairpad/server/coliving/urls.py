from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'living-spaces', views.LivingSpaceViewSet, basename='livingspace')
router.register(r'rooms', views.RoomViewSet, basename='room')
router.register(r'room-applications', views.RoomApplicationViewSet, basename='roomapplication')
router.register(r'reviews', views.LivingSpaceReviewViewSet, basename='livingspacereview')
router.register(r'images', views.LivingSpaceImageViewSet, basename='livingspaceimage')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.get_dashboard, name='coliving_dashboard'),
    path('search/', views.search_spaces, name='search_spaces'),
    path('tasks/', views.TaskListCreateView.as_view(), name='tasks'),
    path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task_detail'),
    path('expenses/', views.ExpenseListCreateView.as_view(), name='expenses'),
    path('expenses/<int:pk>/', views.ExpenseDetailView.as_view(), name='expense_detail'),
    path('expenses/<int:expense_id>/settle/<int:user_id>/', views.settle_expense_split, name='settle_expense_split'),

    # Shared Dashboard
    path('shared-dashboard/<int:living_space_id>/', views.get_shared_dashboard, name='shared_dashboard'),

    # Shopping Lists
    path('<int:living_space_id>/shopping-lists/create/', views.create_shopping_list, name='create_shopping_list'),
    path('shopping-lists/<int:shopping_list_id>/add-item/', views.add_shopping_item, name='add_shopping_item'),
    path('shopping-items/<int:item_id>/toggle/', views.toggle_shopping_item, name='toggle_shopping_item'),

    # Bills
    path('<int:living_space_id>/bills/create/', views.create_bill, name='create_bill'),
    path('bills/<int:bill_id>/', views.BillDetailView.as_view(), name='bill_detail'),
    path('bills/<int:bill_id>/settle/<int:user_id>/', views.settle_bill_split, name='settle_bill_split'),
    path('bills/<int:bill_id>/mark-paid/', views.mark_bill_paid, name='mark_bill_paid'),

    # Calendar Events
    path('<int:living_space_id>/calendar-events/create/', views.create_calendar_event, name='create_calendar_event'),

    # Notifications
    path('notifications/', views.get_notifications, name='get_notifications'),
    path('notifications/<int:notification_id>/mark-read/', views.mark_notification_read, name='mark_notification_read'),

    # House Rules
    path('<int:living_space_id>/house-rules/create/', views.create_house_rules, name='create_house_rules'),
    path('<int:living_space_id>/house-rules/<int:rules_id>/update/', views.update_house_rules, name='update_house_rules'),

    # Invitations and Members
    path('<int:living_space_id>/invite/', views.invite_to_living_space, name='invite_to_living_space'),
    path('invitations/', views.get_my_invitations, name='get_my_invitations'),
    path('invitations/<int:invitation_id>/respond/', views.respond_to_invitation, name='respond_to_invitation'),
    path('<int:living_space_id>/members/', views.get_living_space_members, name='get_living_space_members'),
    path('<int:living_space_id>/members/<int:member_id>/remove/', views.remove_member, name='remove_member'),
]