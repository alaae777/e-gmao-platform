"""
common.permissions
===================
Role-based permissions shared by every app. The e-GMAO role model has only
two roles today (Administrator / Employee) but these classes are written
against `request.user.is_administrator` / `is_employee` rather than
hard-coded role names, so a new role can be added later without touching
every viewset.
"""
from rest_framework import permissions


class IsAdministrator(permissions.BasePermission):
    """Full access reserved to administrators (content & user management)."""

    message = "Réservé aux administrateurs."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_administrator", False)
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Any authenticated user can read; only administrators can write."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(request.user, "is_administrator", False)


class IsOwnerOrAdministrator(permissions.BasePermission):
    """Object-level: owner (via `user` attribute) or an administrator."""

    def has_object_permission(self, request, view, obj):
        if getattr(request.user, "is_administrator", False):
            return True
        owner = getattr(obj, "user", None)
        return owner is not None and owner == request.user
