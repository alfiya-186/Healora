from django.urls import path
from .views import (
    RegisterView, CustomLoginView, 
    PatientProfileUpdateView, WellnessLogListCreateView, 
    PatientDietPlanView, PatientAppointmentListCreateView, NutritionistListView,
    NutritionistPublishDietPlanView, NutritionistPatientListView, PatientDocumentListCreateView,
    AdminUserListView, AdminAppointmentListView, AdminDeleteUserView, 
    AdminToggleUserStatusView, AdminEditUserView, AdminAuditLogListView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # --- AUTH ROUTES ---
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'), 
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # --- PATIENT & NUTRITIONIST ROUTES ---
    path('profile/update/<int:user_id>/', PatientProfileUpdateView.as_view(), name='profile-update'),
    path('patient/<int:user_id>/wellness/', WellnessLogListCreateView.as_view(), name='wellness-logs'),
    path('patient/<int:user_id>/diet/', PatientDietPlanView.as_view(), name='diet-plan'),
    path('patient/<int:user_id>/appointments/', PatientAppointmentListCreateView.as_view(), name='patient-appointments'),
    path('patient/<int:user_id>/documents/', PatientDocumentListCreateView.as_view(), name='patient-documents'),
    
    path('nutritionists/', NutritionistListView.as_view(), name='nutritionist-list'),
    path('nutritionist/patients/', NutritionistPatientListView.as_view(), name='nutritionist-patient-list'),
    path('nutritionist/patient/<int:user_id>/publish-diet/', NutritionistPublishDietPlanView.as_view(), name='publish-diet-plan'),

    # --- ADMIN ROUTES ---
    path('admin-api/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin-api/appointments/', AdminAppointmentListView.as_view(), name='admin-appointments'),
    path('admin-api/users/<int:pk>/delete/', AdminDeleteUserView.as_view(), name='admin-delete-user'),
    path('admin-api/users/<int:pk>/toggle-status/', AdminToggleUserStatusView.as_view(), name='admin-toggle-status'),
    path('admin-api/users/<int:pk>/edit/', AdminEditUserView.as_view(), name='admin-edit-user'),
    path('admin-api/audit-logs/', AdminAuditLogListView.as_view(), name='admin-audit-logs'),
]