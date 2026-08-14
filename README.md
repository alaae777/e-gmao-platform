# e-GMAO — Plateforme de formation en ligne

Plateforme e-learning interne dédiée à la formation sur un outil de **Gestion
de Maintenance Assistée par Ordinateur (GMAO)**. Elle permet à une
organisation de dispenser des parcours de formation structurés
(catégories → formations → modules → chapitres), de valider les acquis par
quiz, de suivre la progression des employés, et de délivrer des certificats
vérifiables à l'issue de chaque formation complétée.

<img width="1273" height="531" alt="image" src="https://github.com/user-attachments/assets/6688304e-380d-4128-b8d2-61a0387c6a6d" />


## Sommaire

- [Aperçu](#aperçu)
- [Architecture générale](#architecture-générale)
- [Stack technique](#stack-technique)
- [Conception fonctionnelle](#conception-fonctionnelle)
  - [Rôles et authentification](#rôles-et-authentification)
  - [Catalogue de formation](#catalogue-de-formation)
  - [Quiz et évaluation](#quiz-et-évaluation)
  - [Progression](#progression)
  - [Certificats](#certificats)
  - [Assistant IA](#assistant-ia)
- [Système de design](#système-de-design)
- [Structure du dépôt](#structure-du-dépôt)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [API — vue d'ensemble](#api--vue-densemble)
- [Roadmap](#roadmap)
- [Équipe & licence](#équipe--licence)

---

## Aperçu

🔲 **À compléter :** captures d'écran (page d'accueil publique, catalogue,
lecteur de module, quiz, certificat, back-office admin).

| Espace public | Espace employé | Back-office admin |
|---|---|---|
| `[capture]` | `[capture]` | `[capture]` |

---

## Architecture générale

L'application suit une architecture classique **API + SPA découplées** :

```
┌─────────────────────┐        HTTPS / JSON        ┌──────────────────────────┐
│   Frontend (React)   │ ─────────────────────────► │   Backend (Django REST)  │
│   Vite + Ant Design   │ ◄───────────────────────── │   PostgreSQL             │
└─────────────────────┘        JWT (access/refresh)  └──────────────────────────┘
                                                              │
                                                              ▼
                                                    ┌──────────────────────┐
                                                    │  Assistant IA (RAG)  │
                                                    │  Ollama / OpenAI /   │
                                                    │  Gemini (swappable)  │
                                                    └──────────────────────┘
```

- Le frontend ne connaît que l'API REST — aucune logique métier côté client
  au-delà de l'affichage et de la navigation.
- L'authentification se fait par **matricule** (pas d'auto-inscription libre
  côté "compte administrateur" — voir plus bas), avec des tokens JWT
  (`djangorestframework-simplejwt`).
- Le fournisseur du LLM de l'assistant est interchangeable via une seule
  variable d'environnement (`LLM_PROVIDER`), sans changer le code appelant.

---

## Stack technique

**Backend**
- Django + Django REST Framework
- PostgreSQL
- `djangorestframework-simplejwt` (auth JWT)
- `django-filter` (filtrage des endpoints)
- `django-cors-headers`

**Frontend**
- React + Vite
- Ant Design (`antd`)
- React Router
- `qrcode.react` (génération de QR code pour les certificats)

**Assistant IA**
- Architecture RAG (Retrieval-Augmented Generation)
- Fournisseur configurable : Ollama (local, par défaut), OpenAI, ou Gemini

🔲 **À compléter :** versions exactes des dépendances si vous voulez les
figer dans le README (sinon `requirements.txt` / `package.json` font foi).

---

## Conception fonctionnelle

### Rôles et authentification

Deux rôles : **Administrateur** et **Employé**.

- L'identifiant de connexion est le **matricule** (`USERNAME_FIELD`), pas
  l'email.
- Un compte peut être créé de deux façons :
  1. Par un administrateur, depuis le back-office (n'importe quel rôle).
  2. Par l'employé lui-même via une page d'inscription publique
     (`/inscription`) — dans ce cas le rôle est **toujours forcé à
     Employé** côté serveur, quoi que le client envoie.
- Les tokens JWT expirent et se rafraîchissent automatiquement
  (`ACCESS_TOKEN_LIFETIME` / `REFRESH_TOKEN_LIFETIME` configurables).

### Catalogue de formation

Hiérarchie à 4 niveaux :

```
Catégorie
 └─ Formation (Training)
     └─ Module
         └─ Chapitre
             ├─ Document(s)  (obligatoire — au moins 1 : guide/support PDF)
             └─ Vidéo(s)     (optionnel)
```

- Un module possède **nécessairement au moins un chapitre** et
  **exactement un quiz** — ce sont les deux seuls éléments obligatoires
  d'un module.
- Chaque **module** est réordonnable (`order`) via un endpoint dédié.
- Chaque **chapitre** de même.
- Un chapitre contient **obligatoirement au moins un document**
  (guide/support au format PDF) — c'est le contenu de référence minimal.
  La vidéo, elle, est **optionnelle** : certains chapitres en ont une,
  d'autres reposent uniquement sur le(s) document(s).

### Quiz et évaluation

```
Quiz (1 par module)
 └─ Question (plusieurs)
     └─ Choix de réponse (plusieurs, 1 ou plusieurs corrects)
```

- Les employés ne voient jamais `is_correct` avant d'avoir soumis leurs
  réponses (sérialiseur public distinct du sérialiseur admin).
- Chaque tentative (`QuizAttempt`) est historisée avec le score obtenu.

### Progression

- La progression (`Progress`) est calculée par formation, en pourcentage
  de modules validés.
- Le passage à 100% déclenche automatiquement la génération d'un
  certificat (voir ci-dessous) — aucune action manuelle requise.

### Certificats

- **Un seul type de certificat : par formation entièrement complétée**
  (pas de certificat par module — c'est un choix de conception assumé).
- Contrainte d'unicité en base : un seul certificat par couple
  (utilisateur, formation).
- Chaque certificat porte un **numéro unique** et une date d'obtention.
- Le certificat imprimable embarque un **QR code** qui pointe vers une
  page de vérification publique (`/certificats/verifier/<numéro>`,
  accessible sans connexion), permettant de confirmer l'authenticité du
  document sans exposer aucune donnée sensible.

```
Employé termine le dernier module
        │
        ▼
Progression recalculée → 100% ?
        │ oui
        ▼
Certificat existe déjà pour (user, training) ?
   │ non                          │ oui
   ▼                              ▼
Création du certificat      Rien à faire
+ notification employé
```

### Assistant IA

- Chatbot flottant, disponible sur toutes les pages authentifiées.
- Repose sur une architecture RAG : les questions sont enrichies par des
  extraits pertinents du contenu de formation avant d'être envoyées au
  LLM (`RAG_TOP_K` extraits par défaut).
- L'historique de conversation envoyé au modèle est volontairement limité
  (derniers échanges seulement) pour garder des temps de réponse
  raisonnables.

🔲 **À compléter :** détail du pipeline RAG si vous voulez le documenter
plus finement (source des embeddings, base vectorielle utilisée, etc.).

---

## Système de design

- **Thème sombre**, un seul accent (bleu-pétrole `#2B8CB0`) réservé aux
  actions primaires et à l'état actif — le reste de la palette reste
  neutre pour ne pas disperser l'attention.
- Typographie : **IBM Plex Sans** (interface), **IBM Plex Mono** (données
  techniques : matricules, codes, dates, identifiants).
- Élément signature : barre de progression segmentée (`.rail-progress`),
  chaque segment représentant un module réel de la séquence.
- Les tokens de design (couleurs, rayons de bordure, ombres) sont
  centralisés dans `src/theme.js` et injectés dans Ant Design via
  `ConfigProvider`.

🔲 **À compléter :** capture de la palette / de la charte si vous voulez
l'illustrer visuellement ici.

---

## Structure du dépôt

```
egmao/
├── backend/
│   └── egmao_backend/
│       ├── egmao/            # settings, urls racine
│       ├── accounts/         # utilisateurs, rôles, auth
│       ├── catalog/          # catégories, formations, modules, chapitres
│       ├── quizzes/          # quiz, questions, choix, tentatives
│       ├── progress/         # progression, certificats
│       ├── assistant/        # chatbot IA (RAG)
│       └── common/           # permissions, validators partagés
└── frontend/
    └── egmao_frontend/
        ├── src/
        │   ├── api/           # client HTTP centralisé
        │   ├── components/    # composants réutilisables
        │   ├── context/       # AuthContext, etc.
        │   ├── layouts/       # AdminLayout, MainLayout
        │   ├── pages/         # pages routées (admin/, employee/, auth/, public/)
        │   └── theme.js       # design tokens
        └── index.html
```

🔲 **À compléter :** ajustez si votre arborescence réelle diverge
(certains dossiers ont été observés via zip, à vérifier contre votre repo
actuel).

---

## Installation

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- (optionnel) Ollama, si vous utilisez l'assistant IA en local

### Backend

```bash
cd backend/egmao_backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # puis renseignez les valeurs (voir plus bas)
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend/egmao_frontend
npm install
npm run dev
```

🔲 **À compléter :** commandes de build/déploiement en production si
différentes (Docker, CI/CD, etc.).

---

## Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `DJANGO_SECRET_KEY` | Clé secrète Django | — (obligatoire en prod) |
| `DJANGO_DEBUG` | Mode debug | `False` |
| `DJANGO_ALLOWED_HOSTS` | Hôtes autorisés, séparés par virgule | `localhost,127.0.0.1` |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Connexion base de données | `egmao` |
| `POSTGRES_HOST` / `POSTGRES_PORT` | — | `localhost` / `5432` |
| `JWT_ACCESS_MINUTES` | Durée de vie du token d'accès | `60` |
| `JWT_REFRESH_DAYS` | Durée de vie du refresh token | `7` |
| `FRONTEND_URL` | Origine du frontend (CORS) | `http://localhost:5173` |
| `LLM_PROVIDER` | `ollama` \| `openai` \| `gemini` | `ollama` |
| `LLM_MODEL` | Modèle utilisé | `llama3.1` |
| `OLLAMA_BASE_URL` | URL du serveur Ollama | `http://localhost:11434` |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | Clés API, si fournisseur cloud utilisé | — |
| `RAG_TOP_K` | Nombre d'extraits injectés dans le contexte RAG | `4` |

🔲 **À compléter :** valeurs réelles pour votre environnement de
production (ne pas les committer, bien sûr — ce tableau documente juste
le rôle de chaque variable).

---

## API — vue d'ensemble

🔲 **À compléter :** générer/lier une doc OpenAPI (`drf-spectacular` ou
équivalent) si vous en avez une, ou lister ici les endpoints principaux.

| Ressource | Endpoint | Notes |
|---|---|---|
| Connexion | `POST /api/accounts/auth/login/` | matricule + mot de passe |
| Inscription | `POST /api/accounts/auth/register/` | rôle forcé à Employé |
| Catalogue | `GET /api/catalog/trainings/` | — |
| Quiz | `GET/POST /api/quizzes/...` | — |
| Progression | `GET /api/progress/...` | — |
| Vérification certificat | `GET /api/progress/certificates/verify/<number>/` | public, sans auth |
| Assistant | `POST /api/assistant/...` | — |

---

## Roadmap

🔲 **À compléter :** vos priorités actuelles / prochaines fonctionnalités.

- [ ] …
- [ ] …

---

## Équipe & licence

🔲 **À compléter :** auteurs/contributeurs, licence du projet (interne,
propriétaire, MIT, etc.), contact.
