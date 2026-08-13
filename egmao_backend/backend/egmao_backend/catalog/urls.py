from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ChapterViewSet, DocumentViewSet, ModuleViewSet, TrainingViewSet, VideoViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("trainings", TrainingViewSet, basename="training")
router.register("modules", ModuleViewSet, basename="module")
router.register("chapters", ChapterViewSet, basename="chapter")
router.register("videos", VideoViewSet, basename="video")
router.register("documents", DocumentViewSet, basename="document")

urlpatterns = router.urls
