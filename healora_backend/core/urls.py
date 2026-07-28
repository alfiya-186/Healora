from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AppointmentViewSet

# The router automatically creates GET, POST, PUT, DELETE routes for us!
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'appointments', AppointmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]