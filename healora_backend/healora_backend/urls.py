from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

# Simple Welcome Page to prevent the yellow 404 error
def home(request):
    return HttpResponse("<h1>✅ Welcome to the Healora API Backend!</h1><p>Your Django PostgreSQL server is running perfectly.</p>")

urlpatterns = [
    path('', home),  # Shows the welcome page at 127.0.0.1:8000
    path('admin/', admin.site.urls), # The Django Admin Panel
    path('api/', include('core.urls')), # Connects to all the routes in core/urls.py
]