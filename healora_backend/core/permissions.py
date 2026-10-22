from rest_framework import permissions

class IsPatient(permissions.BasePermission):
    """Permit access only to authenticated patients."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PATIENT')

class IsNutritionist(permissions.BasePermission):
    """Permit access only to authenticated nutritionists and administrators."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'NUTRITIONIST' or request.user.role == 'ADMIN'))

class IsClinicManager(permissions.BasePermission):
    """Permit access only to authenticated clinic managers and administrators."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'MANAGER' or request.user.role == 'ADMIN'))

class IsAdministrator(permissions.BasePermission):
    """Permit access only to authenticated administrators."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser))

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Object-level and URL-level access control:
    - Allows a patient to access only their own user_id records.
    - Allows Nutritionists, Clinic Managers, and Administrators to access clinical records.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ('NUTRITIONIST', 'MANAGER', 'ADMIN') or request.user.is_staff:
            return True
        target_user_id = view.kwargs.get('user_id')
        if target_user_id is not None:
            return str(request.user.id) == str(target_user_id)
        return True

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ('NUTRITIONIST', 'MANAGER', 'ADMIN') or request.user.is_staff:
            return True
        user_owner = getattr(obj, 'user', None) or getattr(obj, 'patient', None)
        if user_owner:
            owner_id = getattr(user_owner, 'id', user_owner)
            return str(request.user.id) == str(owner_id)
        return False

