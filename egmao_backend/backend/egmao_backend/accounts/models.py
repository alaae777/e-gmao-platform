"""
accounts.models
================
Identity and access management for the e-GMAO platform.
"""
import uuid

from django.conf import settings
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    """Access profile attributed to a user (Administrator, Employee, ...)."""

    class RoleName(models.TextChoices):
        ADMINISTRATOR = "ADMIN", "Administrator"
        EMPLOYEE = "EMPLOYEE", "Employee"

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(
        max_length=50,
        unique=True,
        choices=RoleName.choices,
        help_text="Machine-readable role name, used for permission checks.",
    )

    class Meta:
        db_table = "role"
        verbose_name = "Role"
        verbose_name_plural = "Roles"
        ordering = ["name"]

    def __str__(self):
        return self.get_name_display()


class UserManager(BaseUserManager):
    """Custom manager: login is by `matricule`, not Django's default `username`."""

    use_in_migrations = True

    def _create_user(self, matricule, email, password, **extra_fields):
        if not matricule:
            raise ValueError("Le matricule est obligatoire.")
        email = self.normalize_email(email)
        extra_fields.setdefault("username", matricule)
        user = self.model(matricule=matricule, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, matricule, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        if "role" not in extra_fields or extra_fields["role"] is None:
            extra_fields["role"], _ = Role.objects.get_or_create(
                name=Role.RoleName.EMPLOYEE
            )
        return self._create_user(matricule, email, password, **extra_fields)

    def create_superuser(self, matricule, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields["role"], _ = Role.objects.get_or_create(
            name=Role.RoleName.ADMINISTRATOR
        )
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(matricule, email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user model for e-GMAO.

    Added fields (GMAO-specific): matricule, photo, role.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    matricule = models.CharField(
        max_length=20,
        unique=True,
        help_text="ONCF employee registration number, used as the functional login key.",
    )
    photo = models.ImageField(
        upload_to="users/photos/%Y/%m/", blank=True, null=True
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name="users",
        help_text="Access profile of the user (Administrator or Employee).",
    )

    objects = UserManager()

    # Login with matricule instead of the default `username` field.
    USERNAME_FIELD = "matricule"
    REQUIRED_FIELDS = ["email", "first_name", "last_name"]

    class Meta:
        db_table = "utilisateur"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.matricule} — {self.get_full_name() or self.username}"

    @property
    def is_administrator(self) -> bool:
        return self.role_id is not None and self.role.name == Role.RoleName.ADMINISTRATOR

    @property
    def is_employee(self) -> bool:
        return self.role_id is not None and self.role.name == Role.RoleName.EMPLOYEE