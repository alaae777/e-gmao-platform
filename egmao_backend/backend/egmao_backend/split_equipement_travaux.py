import os
import shutil
import pypdf
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "egmao.settings")
django.setup()

from catalog.models import Chapter, Document

PDF_SOURCE = "C:/Users/THINKUP/Downloads/V6-TR-Formation-EquipementTravaux V2 (1).pdf"
OUTPUT_DIR_USER = "C:/Users/THINKUP/Downloads/decoupe_pdf/chapitres_equipement_travaux"
MEDIA_REL_PATH = "chapters/documents/2026/08"
MEDIA_ABS_PATH = os.path.join("c:/Users/THINKUP/Downloads/files (2)/egmao_backend/backend/egmao_backend/media", MEDIA_REL_PATH)

os.makedirs(OUTPUT_DIR_USER, exist_ok=True)
os.makedirs(MEDIA_ABS_PATH, exist_ok=True)

# Map Chapter ID -> (Filename, Title, 1-based page list)
MAPPING = {
    2: ("01_Connexion_a_CARL_Source.pdf", "Guide - Connexion à CARL Source", [5, 6]),
    3: ("02_Barre_CARL_Source_et_chemin_de_fer.pdf", "Guide - Barre CARL Source et chemin de fer", [7, 8, 9]),
    4: ("03_Boutons_standards_et_navigation.pdf", "Guide - Accès aux modules et boutons standards", [10, 11]),
    5: ("04_Generalites_utilisateurs_et_profils.pdf", "Guide - Généralités utilisateurs et profils", [12]),
    6: ("05_Creation_utilisateur_et_domaines.pdf", "Guide - Création d'utilisateur et domaines métier", [13]),
    7: ("06_Criteres_de_recherche_et_favoris.pdf", "Guide - Critères de recherche et favoris", [14]),
    8: ("07_Resultats_filtres_tri_raccourcis.pdf", "Guide - Résultats, filtres, tri et raccourcis", [15, 16, 17, 18]),
    10: ("08_Edition_de_rapports_BIRT.pdf", "Guide - Édition de rapports BIRT", [19, 20]),
    11: ("09_Assistant_de_creation_de_rapports.pdf", "Guide - Assistant de création de rapports", [21]),
    12: ("10_Export_de_donnees.pdf", "Guide - Export des données (Excel, CSV, XML)", [22]),
    13: ("11_Mise_a_jour_en_masse.pdf", "Guide - Mise à jour en masse", [23]),
    14: ("12_Documents_lies_et_bibliotheque.pdf", "Guide - Documents liés et bibliothèque", [24, 25]),
    15: ("13_Memos_et_caracteristiques.pdf", "Guide - Mémos et caractéristiques personnalisées", [26, 27]),
    52: ("14_Elements_de_structure_et_arborescences.pdf", "Guide - Éléments de structure et arborescences", [29, 30, 31]),
    53: ("15_Fiche_materiel_et_cycle_de_vie.pdf", "Guide - Fiche matériel et cycle de vie", [32, 33]),
    54: ("16_Modeles_de_materiels_et_nomenclature.pdf", "Guide - Modèles de matériels et nomenclature", [34]),
    55: ("17_Structure_technique_et_geographique.pdf", "Guide - Structure technique et géographique", [35]),
    56: ("18_Calendrier_de_disponibilite_materiel.pdf", "Guide - Calendrier de disponibilité matériel", [36, 37]),
    57: ("19_Modeles_de_points_de_mesure.pdf", "Guide - Modèles de points de mesure", [38]),
    58: ("20_Releves_et_suivi_de_mesures.pdf", "Guide - Relevés et suivi de mesures", [39, 40]),
    59: ("21_Saisie_signalement_fixe_et_roulant.pdf", "Guide - Saisie signalement (matériel fixe / roulant)", [43, 44, 46, 47, 48]),
    60: ("22_Cycle_de_vie_du_signalement.pdf", "Guide - Cycle de vie du signalement", [45]),
    61: ("23_Creation_et_formulaire_intervention.pdf", "Guide - Création et formulaire général d'intervention", [49, 50, 51, 52, 54, 55, 56, 57]),
    62: ("24_Diagnostic_et_cycle_de_vie_intervention.pdf", "Guide - Diagnostic et cycle de vie intervention", [53, 58, 59, 60]),
    63: ("25_Macroplanning_et_affectation_ressources.pdf", "Guide - Macroplanning et affectation des ressources", [61, 62, 63]),
    64: ("26_Saisie_de_compte_rendu_intervention.pdf", "Guide - Saisie de compte-rendu d'intervention", [64, 65, 66]),
    65: ("27_Gestion_des_sinistres.pdf", "Guide - Gestion des sinistres", [67, 68]),
    66: ("28_Creation_de_gammes.pdf", "Guide - Création de gammes", [69, 70]),
    67: ("29_Plans_d_intervention_simples_et_avances.pdf", "Guide - Plans d'intervention simples et avancés", [71, 72, 73, 74, 76]),
    68: ("30_Plans_preventifs_predefinis_et_lancement.pdf", "Guide - Plans préventifs prédéfinis (EC) et lancement", [75, 77, 78]),
    69: ("31_Projets_et_fiches_de_maintenance.pdf", "Guide - Projets et fiches de maintenance (EC)", [79, 80]),
    70: ("32_Parametres_du_module_Travaux.pdf", "Guide - Paramètres du module Travaux", [81, 82]),
}

reader = pypdf.PdfReader(PDF_SOURCE)
print(f"Loaded source PDF with {len(reader.pages)} pages.")

created_count = 0
for chapter_id, (filename, doc_title, page_numbers) in MAPPING.items():
    try:
        chapter = Chapter.objects.get(id=chapter_id)
    except Chapter.DoesNotExist:
        print(f"Chapter ID {chapter_id} not found in DB, skipping.")
        continue

    writer = pypdf.PdfWriter()
    for p_num in page_numbers:
        # Convert 1-based to 0-based index
        writer.add_page(reader.pages[p_num - 1])

    # Save to user download folder
    user_out_path = os.path.join(OUTPUT_DIR_USER, filename)
    with open(user_out_path, "wb") as f:
        writer.write(f)

    # Save to Django media folder
    media_out_path = os.path.join(MEDIA_ABS_PATH, filename)
    with open(media_out_path, "wb") as f:
        writer.write(f)

    # DB file relative path
    db_file_path = f"{MEDIA_REL_PATH}/{filename}"

    # Check if document already exists for this chapter with this title or file
    doc, created = Document.objects.get_or_create(
        chapter=chapter,
        doc_type=Document.DocType.PDF,
        defaults={
            "title": doc_title,
            "file": db_file_path,
        }
    )
    if not created:
        doc.title = doc_title
        doc.file = db_file_path
        doc.save()

    created_count += 1
    print(f"OK [Chapter {chapter_id}: {chapter.title}] -> {filename} (Pages {page_numbers})")

print(f"\nDone! Processed {created_count} chapter documents successfully.")
