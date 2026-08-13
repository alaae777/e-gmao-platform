"""
common.validators
==================
Defense-in-depth validators for uploaded files: size caps and MIME/extension
whitelists, on top of the `FileExtensionValidator`s already declared on the
models. Used from DRF serializers so a bad upload is rejected with a clean
400 response instead of reaching disk.
"""
from django.conf import settings
from rest_framework import serializers

VIDEO_EXTENSIONS = {"mp4", "webm", "mov", "m4v"}
DOCUMENT_EXTENSIONS = {"pdf", "doc", "docx", "ppt", "pptx"}
IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}


def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def validate_video_file(file_obj):
    ext = _extension(file_obj.name)
    if ext not in VIDEO_EXTENSIONS:
        raise serializers.ValidationError(
            f"Format vidéo non supporté ({ext}). Formats autorisés : {', '.join(sorted(VIDEO_EXTENSIONS))}."
        )
    if file_obj.size > settings.MAX_VIDEO_UPLOAD_SIZE:
        raise serializers.ValidationError(
            f"Fichier vidéo trop volumineux ({file_obj.size / 1_000_000:.1f} Mo). "
            f"Taille max : {settings.MAX_VIDEO_UPLOAD_SIZE / 1_000_000:.0f} Mo."
        )


def validate_document_file(file_obj):
    ext = _extension(file_obj.name)
    if ext not in DOCUMENT_EXTENSIONS:
        raise serializers.ValidationError(
            f"Format de document non supporté ({ext}). Formats autorisés : {', '.join(sorted(DOCUMENT_EXTENSIONS))}."
        )
    if file_obj.size > settings.MAX_DOCUMENT_UPLOAD_SIZE:
        raise serializers.ValidationError(
            f"Document trop volumineux ({file_obj.size / 1_000_000:.1f} Mo). "
            f"Taille max : {settings.MAX_DOCUMENT_UPLOAD_SIZE / 1_000_000:.0f} Mo."
        )


def validate_image_file(file_obj):
    ext = _extension(file_obj.name)
    if ext not in IMAGE_EXTENSIONS:
        raise serializers.ValidationError(
            f"Format d'image non supporté ({ext}). Formats autorisés : {', '.join(sorted(IMAGE_EXTENSIONS))}."
        )
    if file_obj.size > settings.MAX_IMAGE_UPLOAD_SIZE:
        raise serializers.ValidationError(
            f"Image trop volumineuse ({file_obj.size / 1_000_000:.1f} Mo). "
            f"Taille max : {settings.MAX_IMAGE_UPLOAD_SIZE / 1_000_000:.0f} Mo."
        )
