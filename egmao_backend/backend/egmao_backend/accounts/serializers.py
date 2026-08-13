from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from common.validators import validate_image_file

from .models import Role, User


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name"]


class EGmaoTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login with `matricule` + password, embed role/name in the JWT payload."""

    username_field = User.USERNAME_FIELD  # "matricule"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["matricule"] = user.matricule
        token["role"] = user.role.name if user.role_id else None
        token["full_name"] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SlugRelatedField(
        slug_field="name", queryset=Role.objects.all()
    )
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id", "matricule", "username", "first_name", "last_name",
            "email", "photo", "role", "is_active", "date_joined", "last_login",
        ]
        read_only_fields = ["id", "date_joined", "last_login"]

    def validate_photo(self, value):
        if value:
            validate_image_file(value)
        return value


class UserCreateSerializer(UserSerializer):
    """Used by administrators to create a new account with a temporary password."""

    password = serializers.CharField(write_only=True, required=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["password"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ResetPasswordSerializer(serializers.Serializer):
    """Admin-triggered reset: sets a new password for a given user."""

    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def save(self, **kwargs):
        user = self.context["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Self-service: the logged-in user changes their own password."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
class SelfRegisterSerializer(serializers.ModelSerializer):
    """
    Self-service account creation. Unlike UserCreateSerializer (admin-only),
    this never accepts a `role` from the client — every self-registered
    account is forced to Employee, regardless of what's sent.
    """

    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["matricule", "first_name", "last_name", "email", "password"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_matricule(self, value):
        if User.objects.filter(matricule=value).exists():
            raise serializers.ValidationError("Ce matricule est déjà associé à un compte.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        employee_role, _ = Role.objects.get_or_create(name=Role.RoleName.EMPLOYEE)
        user = User(username=validated_data["matricule"], role=employee_role, **validated_data)
        user.set_password(password)
        user.save()
        return user