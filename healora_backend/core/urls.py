from django.urls import path
from .views import RegisterView, AppointmentCreateView, CustomLoginView, PatientProfileUpdateView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'), 
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('appointments/create/', AppointmentCreateView.as_view(), name='appointment-create'),
    path('profile/update/<int:user_id>/', PatientProfileUpdateView.as_view(), name='profile-update'),
]