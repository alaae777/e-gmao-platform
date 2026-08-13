from django.contrib.auth import get_user_model
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from common.permissions import IsAdministrator

from .models import Role
from .serializers import (
    ChangePasswordSerializer,
    EGmaoTokenObtainPairSerializer,
    ResetPasswordSerializer,
    RoleSerializer,
    UserCreateSerializer,
    UserSerializer,
    SelfRegisterSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    """POST {matricule, password} -> {access, refresh, user}."""

    serializer_class = EGmaoTokenObtainPairSerializer


class RoleListView(generics.ListAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]


class MeView(generics.RetrieveUpdateAPIView):
    """Logged-in user reads/updates their own profile."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Mot de passe mis à jour."})


class UserViewSet(viewsets.ModelViewSet):
    """
    Full CRUD on users, reserved to administrators, plus:
      - POST /users/{id}/reset-password/ -> admin resets someone's password
      - POST /users/{id}/set-active/     -> activate/deactivate an account
    """

    queryset = User.objects.select_related("role").all()
    permission_classes = [IsAdministrator]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["matricule", "username", "first_name", "last_name", "email"]
    ordering_fields = ["last_name", "date_joined"]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        user = self.get_object()
        serializer = ResetPasswordSerializer(data=request.data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": f"Mot de passe réinitialisé pour {user.matricule}."})

    @action(detail=True, methods=["post"], url_path="set-active")
    def set_active(self, request, pk=None):
        user = self.get_object()
        is_active = bool(request.data.get("is_active", True))
        user.is_active = is_active
        user.save(update_fields=["is_active"])
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
class RegisterView(generics.CreateAPIView):
    """POST /api/accounts/auth/register/ — inscription libre, rôle forcé à Employé."""

    serializer_class = SelfRegisterSerializer
    permission_classes = [permissions.AllowAny]