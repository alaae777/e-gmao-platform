"""
e-GMAO URL configuration.

All API routes live under /api/, each app owning its own urls.py:
    /api/accounts/   -> auth (login/refresh/me), roles, users CRUD
    /api/catalog/    -> categories, trainings, modules, chapters, videos, documents
    /api/quizzes/    -> quizzes, questions, choices, submit/attempts
    /api/progress/   -> progress, certificates, chapter completion, admin stats
    /api/assistant/  -> AI assistant chat + conversation history
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/quizzes/", include("quizzes.urls")),
    path("api/progress/", include("progress.urls")),
    path("api/assistant/", include("assistant.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
