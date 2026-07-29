from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

# This function creates a simple Welcome Page!
def home(request):
    return HttpResponse("<h1>✅ Welcome to the Healora API Backend!</h1><p>Your Django server is running perfectly.</p>")

urlpatterns = [
    path('', home),  # <--- THIS FIXES THE 404 ERROR!
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
]