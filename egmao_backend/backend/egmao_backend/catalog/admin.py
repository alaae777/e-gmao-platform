from django.contrib import admin

from .models import Category, Chapter, Document, Module, Training, Video


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 0
    show_change_link = True


class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 0
    show_change_link = True


class VideoInline(admin.TabularInline):
    model = Video
    extra = 0


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "level", "order", "created_at")
    list_filter = ("category", "level")
    search_fields = ("title", "description")
    inlines = [ModuleInline]


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "training", "order")
    list_filter = ("training",)
    inlines = [ChapterInline]


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "module", "order")
    list_filter = ("module__training",)
    inlines = [VideoInline, DocumentInline]


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "chapter", "duration_seconds")


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "chapter", "doc_type")
    list_filter = ("doc_type",)
