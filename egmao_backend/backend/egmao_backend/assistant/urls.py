from rest_framework.routers import DefaultRouter

from .views import ChatView, ConversationViewSet
from django.urls import path

router = DefaultRouter()
router.register("conversations", ConversationViewSet, basename="conversation")

urlpatterns = [
    path("chat/", ChatView.as_view(), name="assistant_chat"),
] + router.urls
