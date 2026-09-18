# 🛠️ MERISE FORGE

<div align="center">
  <img src="public/logo.jpeg" alt="MERISE FORGE Logo" width="120" style="border-radius: 16px; box-shadow: 0 0 30px rgba(250, 204, 21, 0.4);" />
  <h3><strong>MERISE FORGE</strong></h3>
  <p><em>by PAGUERA</em></p>
  <p><strong>L'outil moderne, visuel et 100% autonome de modélisation Merise · Ambiance Cyberpunk</strong></p>
  <p>MCD (Conceptuel) $\rightarrow$ MLD (Logique) $\rightarrow$ MPD & SQL (MariaDB, MySQL, PostgreSQL, SQLite)</p>
</div>

---

## 📌 Sommaire

- [Aperçu du Projet](#-aperçu-du-projet)
- [Thèmes Cyberpunk & Néons Fluo](#-thèmes-cyberpunk--néons-fluo)
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Support Multi-SGBD (SQL)](#-support-multi-sgbd-sql)
- [Architecture & Pile Technique](#-architecture--pile-technique)
- [Structure du Projet](#-structure-du-projet)
- [Installation & Démarrage Local](#-installation--démarrage-local)
- [Déploiement Docker & Docker Compose](#-déploiement-docker--docker-compose)
- [Scripts Disponibles](#-scripts-disponibles)

---

## 🚀 Aperçu du Projet

**MERISE FORGE** (par **PAGUERA**) est une application web moderne, visuelle et totalement autonome, conçue pour modéliser des bases de données relationnelles selon la méthode Merise avec une direction artistique Cyberpunk sombre & néons :

1. **MCD (Modèle Conceptuel de Données)** :
   - Création visuelle d'entités, d'attributs (types, contraintes, clés primaires, nullabilité, unicité) et d'associations.
   - Gestion intuitive des cardinalités (`0,1`, `1,1`, `0,n`, `1,n`) et des attributs portés par les relations.
2. **MLD (Modèle Logique de Données)** :
   - Transformation automatique du MCD vers les tables relationnelles selon les règles formelles Merise.
   - Détection automatique des tables de jonction (relations *N:M*) et propagation des clés étrangères (*1:N*).
3. **MPD (Modèle Physique de Données) & SQL** :
   - Génération en temps réel des scripts SQL DDL avec contraintes de clés primaires, clés étrangères et `ON DELETE CASCADE`.

---

## ⚡ Thèmes Cyberpunk & Néons Fluo

Directement inspiré par l'univers visuel de **PAGUERA**, MERISE FORGE propose 4 déclinaisons thématiques sombres et fluorescentes :

1. 🟡 **Cyberpunk Yellow (Défaut)** : Fond sombre profond (`#07080e`), jaune électrique fluorescent (`#facc15`), cyan néon (`#06b6d4`), et effets de lueurs ambiantes.
2. 🔷 **Neon Cyan Fluo** : Bleu cyan électrique (`#00f2fe`) et rose néon (`#ec4899`) sur fond ultra-sombre.
3. 🟣 **Violet Synthwave** : Violet électrique (`#a855f7`) et magenta hot pink (`#f43f5e`).
4. 🌑 **Dark Stealth** : Titane sombre haute précision et bleu glacier (`#0ea5e9`).

---

## ✨ Fonctionnalités Principales

- 🎨 **Canvas Graphique Interactif** :
  - Déplacement fluide des entités et relations.
  - Zoom fluide, centrage et grille magnétique.
  - Lignes de liaisons dynamiques et animées.
- 🗄️ **Génération SQL Multi-SGBD (4 moteurs)** :
  - **MariaDB** (avec `ENGINE=InnoDB`)
  - **MySQL** (syntaxe standard MySQL 8)
  - **PostgreSQL** (`SERIAL`, `TIMESTAMPTZ`, contraintes DDL standards)
  - **SQLite** (`INTEGER PRIMARY KEY AUTOINCREMENT`, contraintes inline, `PRAGMA foreign_keys = ON`)
- 📥 **Import / Export complet & Sans restriction** :
  - **Rétro-ingénierie SQL** : Importez un script `.sql` existant pour reconstruire automatiquement le diagramme MCD.
  - **Export ZIP complet** : Téléchargez d'un simple clic une archive avec les captures PNG haute définition de vos diagrammes (MCD, MLD, MPD) et le script `schema.sql`.
  - **Sauvegarde locale** : Enregistrez et chargez autant de projets que vous le souhaitez sur votre navigateur (`LocalStorage`), sans compte ni connexion requise.

---

## 🗄️ Support Multi-SGBD (SQL)

| Dialecte | Clé Primaire Auto | Types Spécifiques | Contraintes Clés Étrangères |
|---|---|---|---|
| **MariaDB** | `AUTO_INCREMENT` | Backticks, `ENGINE=InnoDB` | `ALTER TABLE ... ADD CONSTRAINT` |
| **MySQL** | `AUTO_INCREMENT` | Backticks | `ALTER TABLE ... ADD CONSTRAINT` |
| **PostgreSQL** | `SERIAL` | Double quotes, `TIMESTAMPTZ`, `TEXT` | `ALTER TABLE ... ADD CONSTRAINT` + `DROP ... CASCADE` |
| **SQLite** | `PRIMARY KEY AUTOINCREMENT` | Types dynamiques (`INTEGER`, `REAL`, `TEXT`) | Contraintes inline `FOREIGN KEY (...) REFERENCES` |

---

## 🧰 Architecture & Pile Technique

| Domaine | Technologies |
|---|---|
| **Framework Frontend** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Bundler & Outillage** | [Vite 8](https://vitejs.dev/) + [SWC](https://swc.rs/) |
| **Style & UI** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) + `tailwindcss-animate` |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) (avec persistance locale) |
| **Rendu & Export** | `html-to-image`, `jszip` |

---

## 📂 Structure du Projet

```text
merise-forge/
├── public/                 # Assets statiques (logo.jpeg, favicon, etc.)
├── src/
│   ├── assets/             # Médias et logos thématiques
│   ├── components/         # Composants UI
│   │   ├── canvas/         # Moteur de rendu des canvas (MCD, MLD, MPD, Noeuds, Liens)
│   │   ├── dialogs/        # Modales (sauvegarde, chargement de projets locaux)
│   │   ├── sidebar/        # Barres d'outils MCD, MLD, MPD
│   │   └── ui/             # Composants shadcn/ui
│   ├── hooks/              # Hooks Zustand, CanvasZoom, useTheme Cyberpunk
│   ├── lib/                # Moteur MCD -> MLD, générateurs SQL multi-SGBD
│   ├── pages/              # Vue principale Index
│   └── types/              # Définitions TypeScript Merise
└── package.json            # Dépendances et scripts
```

---

## 💻 Installation & Démarrage Local

### Prérequis

- [Node.js](https://nodejs.org/) (version 18+) ou [Bun](https://bun.sh/)

### 1. Installation

```bash
git clone <URL_DU_DEPOT>
cd merise-forge
npm install
```

### 2. Démarrer en développement

```bash
npm run dev
```

L'application est disponible immédiatement sur `http://localhost:8080`.

### 3. Compiler pour la production

```bash
npm run build
```

---

## 🐳 Déploiement Docker & Docker Compose

L'application intègre un `Dockerfile` multi-étapes (Node 20 Alpine pour la compilation, puis Nginx Alpine pour le service) et un `docker-compose.yml`.

### Démarrage avec Docker Compose / Podman Compose

1. Configurer les variables d'environnement dans votre fichier `.env` (ou copier depuis `.env.example`) :
   ```bash
   cp .env.example .env
   ```

2. Lancer le conteneur en arrière-plan :
   ```bash
   docker compose up -d --build
   # Ou avec Podman :
   podman-compose up -d --build
   ```

3. L'application est alors accessible sur `http://localhost:8085` (ou le port défini dans `PORT`).


---

<div align="center">
  <sub>Conçu avec passion par <strong>PAGUERA</strong> · Tous droits réservés © 2026</sub>
</div>
