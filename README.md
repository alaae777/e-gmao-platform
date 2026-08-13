# e-GMAO Platform

## 📌 Présentation

e-GMAO est une plateforme e-learning destinée à la formation du personnel dans le domaine de la Gestion de Maintenance Assistée par Ordinateur (GMAO).

La plateforme permet aux utilisateurs de suivre des formations, consulter des modules et des chapitres, regarder les contenus pédagogiques, passer des évaluations et suivre leur progression.

Elle dispose également d'un espace d'administration permettant de gérer les utilisateurs, les formations, les modules et les quiz.

---

## 🎯 Objectifs

Les principaux objectifs de la plateforme sont :

- Centraliser les formations GMAO.
- Faciliter l'accès aux contenus pédagogiques.
- Permettre aux utilisateurs de suivre leur progression.
- Évaluer les connaissances à travers des quiz.
- Générer et gérer les certificats de formation.
- Permettre la vérification des certificats.
- Fournir une interface d'administration pour gérer la plateforme.
- Proposer une expérience e-learning moderne et intuitive.

---

## ✨ Fonctionnalités

### 👨‍🎓 Espace apprenant

- Création de compte.
- Authentification par matricule et mot de passe.
- Tableau de bord personnel.
- Consultation du catalogue des formations.
- Consultation des modules et chapitres.
- Suivi de la progression.
- Passage des quiz.
- Consultation des résultats.
- Consultation des certificats.
- Profil utilisateur.

### 👨‍💼 Espace administrateur

- Tableau de bord administrateur.
- Gestion des utilisateurs.
- Gestion des catégories.
- Gestion des formations.
- Gestion des modules.
- Gestion des quiz.
- Gestion des questions.
- Gestion des choix de réponses.
- Gestion des certificats.

### 🏆 Certificats

La plateforme permet de générer des certificats associés aux formations.

Chaque certificat possède un numéro permettant son identification et sa vérification.

Un système de vérification permet de vérifier l'authenticité d'un certificat à partir de son numéro.

---

## 🏗️ Architecture du projet

Le projet est organisé en deux parties principales :

```text
e-gmao-platform/
│
├── egmao_backend/
│   └── backend/
│       ├── accounts/
│       ├── catalog/
│       ├── quizzes/
│       ├── progress/
│       ├── common/
│       ├── manage.py
│       └── ...
│
├── egmao_frontend/
│   └── frontend/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── ...
│
├── .gitignore
├── package-lock.json
└── README.md
