from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Role, User


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    list_display = ("matricule", "username", "first_name", "last_name", "email", "role", "is_active")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("matricule", "username", "first_name", "last_name", "email")
    ordering = ("last_name", "first_name")

    fieldsets = (
        (None, {"fields": ("matricule", "username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "email", "photo")}),
        ("Role & permissions", {
            "fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
        }),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("matricule", "username", "email", "role", "password1", "password2"),
        }),
    )
