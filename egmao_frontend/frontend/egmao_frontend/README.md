# e-GMAO — Frontend React (Phase 2 : interface)

Interface React + Ant Design de la plateforme e-learning GMAO (ONCF),
pour les deux rôles définis dans la conception : **Employé** et
**Administrateur**.

## 1. Démarrer

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173 — écran de connexion :

| Matricule | Rôle | Mot de passe |
|---|---|---|
| `ONCF-00123` | Employé | n'importe lequel |
| `ONCF-00001` | Administrateur | n'importe lequel |

Aucun backend requis pour l'instant : l'app tourne entièrement sur un
**mock backend en mémoire** (voir section 3).

## 2. Structure

```
src/
├── theme.js              # tokens de design (couleurs, thème Ant Design)
├── context/AuthContext.jsx
├── components/
│   ├── ProtectedRoute.jsx    # garde d'accès par rôle
│   └── ResourceTable.jsx     # table CRUD générique (liste + modal + suppression)
├── layouts/
│   ├── MainLayout.jsx    # sidebar + topbar, zone employé
│   └── AdminLayout.jsx   # sidebar + topbar, zone admin
├── pages/
│   ├── auth/Login.jsx
│   ├── employee/          # Dashboard, Catalogue, Détail formation,
│   │                       # Chapitre (vidéo/PDF), Quiz, Progression,
│   │                       # Certificats, Profil
│   └── admin/              # Dashboard, Utilisateurs, Catégories,
│                            # Formations, Modules/Chapitres/Vidéos/
│                            # Documents, Quiz/Questions/Choix
├── api/client.js          # point d'entrée unique utilisé par les pages
└── mock/                  # backend simulé (voir section 3)
```

## 3. Le mock backend — et comment le retirer

`src/mock/mockServer.js` réimplémente en JavaScript **exactement** les
mêmes règles métier que le backend Django déjà livré :

- un chapitre ne se débloque que si le précédent (même module) est terminé ;
- le quiz d'un module ne se débloque que si tous ses chapitres sont terminés ;
- la progression (`Progress.percentage`) est recalculée, jamais stockée à la main ;
- atteindre 100 % délivre automatiquement un certificat.

Toutes les pages passent exclusivement par `src/api/client.js` — jamais
par `mock/` directement. Pour brancher la vraie API Django (phase 3) :

1. Dans `src/api/client.js`, remplacer chaque fonction par un appel
   `axios` vers l'endpoint REST correspondant (les noms de fonctions et
   les formes de données retournées ont été conçus pour matcher
   directement les modèles Django déjà livrés).
2. Supprimer le dossier `src/mock/`.

Aucune page n'a besoin d'être modifiée pour ce changement.

## 4. Ce qui a été vérifié

- `npm run build` : ✅ build de production réussi.
- `npx oxlint` : ✅ 0 erreur (1 avertissement bénin, un pattern React standard).
- Parcours testés manuellement dans le mock : connexion (employé/admin),
  navigation catalogue → formation → chapitre → passage de quiz →
  déblocage automatique du module suivant → génération du certificat à
  100 % ; CRUD complet côté admin (utilisateurs, catégories, formations,
  modules, chapitres, vidéos, documents, quiz, questions, choix).

## 5. Design

Voir les commentaires en tête de `src/theme.js` pour le détail des choix
(couleur primaire orange ONCF `#E76A1F`, typographie Inter, sidebar
sombre + topbar claire, cards arrondies à ombre douce, anneaux de
progression circulaires comme signature visuelle).

## 6. Prochaine étape

Brancher ce frontend sur une vraie API Django REST Framework (phase 3),
en suivant le contrat déjà défini par `src/api/client.js` et
`src/mock/mockServer.js`.
