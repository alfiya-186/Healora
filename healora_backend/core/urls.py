from django.urls import path
from .views import (
    RegisterView, CustomLoginView, PasswordResetRequestView, PasswordResetVerifyView,
    PatientProfileUpdateView, WellnessLogListCreateView, 
    PatientDietPlanView, PatientAppointmentListCreateView, NutritionistListView,
    NutritionistPublishDietPlanView, NutritionistPatientListView, PatientDocumentListCreateView,
    AdminUserListView, AdminAppointmentListView, AdminDeleteUserView, 
    AdminToggleUserStatusView, AdminEditUserView, AdminAuditLogListView,
    ClinicHolidayListCreateView, ClinicHolidayDeleteView, AppointmentUpdateView,
    RazorpayCreateOrderView, RazorpayVerifyPaymentView, RazorpayRefundPaymentView,
    TelehealthSignalView, TelehealthSaveNotesView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # --- WEBRTC TELEHEALTH VIDEO SIGNALLING & NOTES ROUTES ---
    path('telehealth/signal/<int:appointment_id>/', TelehealthSignalView.as_view(), name='telehealth-signal'),
    path('telehealth/notes/<int:appointment_id>/', TelehealthSaveNotesView.as_view(), name='telehealth-save-notes'),

    # --- RAZORPAY PAYMENT GATEWAY ROUTES ---
    path('payments/create-order/', RazorpayCreateOrderView.as_view(), name='razorpay-create-order'),
    path('payments/verify-payment/', RazorpayVerifyPaymentView.as_view(), name='razorpay-verify-payment'),
    path('payments/refund/', RazorpayRefundPaymentView.as_view(), name='razorpay-refund'),

    # --- AUTH ROUTES ---
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'), 
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/verify/', PasswordResetVerifyView.as_view(), name='password-reset-verify'),
    
    # --- PATIENT & NUTRITIONIST ROUTES ---
    path('profile/update/<int:user_id>/', PatientProfileUpdateView.as_view(), name='profile-update'),
    path('patient/<int:user_id>/wellness/', WellnessLogListCreateView.as_view(), name='wellness-logs'),
    path('patient/<int:user_id>/diet/', PatientDietPlanView.as_view(), name='diet-plan'),
    path('patient/<int:user_id>/appointments/', PatientAppointmentListCreateView.as_view(), name='patient-appointments'),
    path('appointments/<int:pk>/', AppointmentUpdateView.as_view(), name='appointment-update'),
    path('patient/<int:user_id>/documents/', PatientDocumentListCreateView.as_view(), name='patient-documents'),

    
    path('nutritionists/', NutritionistListView.as_view(), name='nutritionist-list'),
    path('nutritionist/patients/', NutritionistPatientListView.as_view(), name='nutritionist-patient-list'),
    path('nutritionist/patient/<int:user_id>/publish-diet/', NutritionistPublishDietPlanView.as_view(), name='publish-diet-plan'),

    # --- CLINIC HOLIDAYS & LEAVES ROUTES ---
    path('clinic-holidays/', ClinicHolidayListCreateView.as_view(), name='clinic-holidays'),
    path('clinic-holidays/<int:pk>/', ClinicHolidayDeleteView.as_view(), name='clinic-holiday-delete'),

    # --- ADMIN ROUTES ---
    path('admin-api/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin-api/appointments/', AdminAppointmentListView.as_view(), name='admin-appointments'),
    path('admin-api/users/<int:pk>/delete/', AdminDeleteUserView.as_view(), name='admin-delete-user'),
    path('admin-api/users/<int:pk>/toggle-status/', AdminToggleUserStatusView.as_view(), name='admin-toggle-status'),
    path('admin-api/users/<int:pk>/edit/', AdminEditUserView.as_view(), name='admin-edit-user'),
    path('admin-api/audit-logs/', AdminAuditLogListView.as_view(), name='admin-audit-logs'),
]