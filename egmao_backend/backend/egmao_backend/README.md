# e-GMAO — Backend Django (Phase 1 : modèle de données)

Backend Django de la plateforme e-learning GMAO pour l'ONCF. Cette phase
livre la **couche de données complète** : projet Django configuré,
4 apps, modèles, admin, migrations — validés par une migration réelle
(SQLite jetable) et un test de bout en bout (voir plus bas).

## 1. Structure du projet

```
egmao_backend/
├── manage.py
├── requirements.txt
├── docker-compose.yml        # PostgreSQL local (dev uniquement)
├── .env.example               # variables d'environnement à copier en .env
├── egmao/                     # configuration du projet
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py / asgi.py
├── accounts/                  # Role, User (authentification)
├── catalog/                   # Category, Training, Module, Chapter, Video, Document
├── quizzes/                   # Quiz, Question, Choice, QuizAttempt, UserAnswer
└── progress/                  # ChapterProgress, Progress, Certificate
```

Chaque app correspond au découpage validé du MCD/MLD (`accounts` =
Rôle/Utilisateur, `catalog` = contenu pédagogique, `quizzes` = moteur
d'évaluation, `progress` = suivi et certification).

## 2. Correspondance avec le MCD/MLD validé

| Entité MCD/MLD | Modèle Django | App |
|---|---|---|
| Role | `Role` | accounts |
| Utilisateur | `User` (étend `AbstractUser`) | accounts |
| Categorie | `Category` | catalog |
| Formation | `Training` | catalog |
| Module | `Module` | catalog |
| Chapitre | `Chapter` | catalog |
| Video | `Video` | catalog |
| Document | `Document` | catalog |
| Quiz | `Quiz` | quizzes |
| Question | `Question` | quizzes |
| Choix | `Choice` | quizzes |
| TentativeQuiz | `QuizAttempt` | quizzes |
| ReponseUtilisateur | `UserAnswer` | quizzes |
| Progression | `Progress` | progress |
| Certificat | `Certificate` | progress |

`password` (via `AbstractUser`), `url_pdf`, `ordre` (`order`) et le lien
Progression → Formation (`Training`) correspondent aux dernières
corrections validées.

### Ajout technique : `ChapterProgress`

Le cahier des charges impose deux règles que le MCD/MLD (qui ne suit la
progression qu'au niveau Formation) ne peut pas, à lui seul, faire
respecter :

- *"Le chapitre suivant reste verrouillé tant que le précédent n'est pas
  terminé."*
- *"L'employé n'a pas accès au quiz tant que tous les chapitres du
  module ne sont pas terminés."*

Le modèle `ChapterProgress` (user, chapter, completed) a donc été ajouté
**en plus** des entités validées, uniquement comme détail
d'implémentation pour supporter ce verrouillage et calculer
automatiquement le pourcentage de `Progress`. Il n'introduit pas de
nouveau concept métier — voir le docstring en tête de
`progress/models.py`.

## 3. Installation

```bash
python3 -m venv venv
source venv/bin/activate            # Windows : venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env                # puis ajuster si besoin

docker compose up -d                # démarre PostgreSQL en local
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Admin Django : http://localhost:8000/admin/

## 4. Ce qui a été vérifié

- `python manage.py makemigrations` : migrations générées sans erreur pour les 4 apps.
- `python manage.py check` : aucun problème détecté.
- `python manage.py migrate` (sur une base SQLite jetable) : toutes les migrations s'appliquent avec succès, y compris les contraintes d'unicité.
- **Test de bout en bout** : création d'un rôle, d'un utilisateur, d'une formation → module → chapitres, d'un quiz avec question/choix ; simulation d'un employé qui termine ses chapitres et réussit le quiz ; appel à `Progress.recompute()` → résultat : progression à 100 %, statut `COMPLETED`, **certificat généré automatiquement**. Tout fonctionne comme prévu par les règles métier.

## 5. Prochaines phases (non incluses ici)

1. **API** (Django REST Framework) : sérialiseurs + endpoints pour chaque app, permissions par rôle (Administrateur / Employé), authentification par token/session.
2. **Logique métier avancée** : signaux pour déclencher `Progress.recompute()` automatiquement à chaque `ChapterProgress`/`QuizAttempt`, génération réelle du PDF de certificat (ex. WeasyPrint/ReportLab), verrouillage effectif des vues (chapitre/quiz) selon `ChapterProgress`.
3. **Frontend React** (Ant Design) : catalogue, lecteur vidéo/PDF, interface de quiz, tableau de bord de progression, back-office administrateur.
4. **Déploiement** : Dockerfile applicatif, configuration Gunicorn/Nginx, stockage des médias (S3 ou équivalent) pour la production.

Dis-moi quelle phase tu veux qu'on attaque ensuite.
