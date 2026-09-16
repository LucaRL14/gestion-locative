# 🏠 Gestion Locative

Application web moderne, légère et intuitive pour le pilotage financier de vos biens immobiliers et colocations.

Elle permet de suivre en temps réel la réception des loyers, de gérer les dépôts de garantie, de suivre les dépenses réelles et de calculer automatiquement votre **cash-flow net** mensuel.

---

## 🌟 Fonctionnalités clés

- **Gestion Multi-Biens** : Organisez vos biens immobiliers sous forme d'onglets personnalisables (ex: *Colocation Ransart*, *Appartement Paris*, etc.). Ajoutez ou supprimez des biens en toute simplicité.
- **Suivi des Loyers en 1 clic** :
  - Statuts visuels pour chaque locataire : `✅ Reçu`, `❌ Impayé`, `⏱️ En attente`.
  - Date d'échéance et gestion automatique des montants au prorata.
  - Calcul du **taux de paiement** mensuel en temps réel avec barre de progression.
- **Historique Visuel des Paiements** :
  - Pastilles de couleur (vert, rouge, orange) sous chaque fiche locataire pour visualiser l'historique mois par mois en un clin d'œil.
- **Navigation Temporelle** :
  - Parcourez les mois passés et futurs (boutons `◀` et `▶`) pour consulter les archives ou préparer les prévisions financières.
- **Calcul Financier Avancé** :
  - **Revenus réels vs attendus** : Totalité des loyers perçus.
  - **Provisions pour charges** : Gestion des avances sur charges par locataire (125 €/locataire par défaut).
  - **Cash-flow Net** : Calculé sur la base des loyers nets (hors provisions de charges) déduction faite des dépenses fixes mensuelles.
  - **Dépenses Fixes** : Précompte immobilier, assurances, crédit immobilier (avec bascule automatique du différé de crédit).
  - **Dépenses Variables & Delta Charges** : Eau, électricité, gaz, internet, nettoyage, etc. Comparaison en temps réel entre les provisions perçues et les dépenses réelles (*Delta charges*).
- **Garanties Locatives** : Suivi des cautions bloquées par locataire avec modification directe depuis l'interface.
- **Synchronisation Cloud & Mobile (Supabase)** :
  - Accès sécurisé par Email / Mot de passe.
  - Sauvegarde instantanée dans le Cloud (base PostgreSQL).
  - Données synchronisées entre votre smartphone et votre ordinateur.

---

## 🛠️ Stack Technique

- **Frontend** : HTML5 sémantique, CSS3 moderne (variables CSS, glassmorphism, responsive design), Vanilla JavaScript (sans framework lourd, ultra rapide).
- **Backend & Base de données** : [Supabase](https://supabase.com/) (PostgreSQL hébergé, Authentification, Row Level Security - RLS).
- **Hébergement & Déploiement** : Prêt pour [GitHub Pages](https://pages.github.com/) (workflow CI/CD inclus) ou [Netlify](https://www.netlify.com/) (`netlify.toml` inclus).

---

## 📁 Structure du Projet

```text
├── .github/workflows/
│   └── deploy.yml          # Déploiement automatique sur GitHub Pages
├── index.html              # Interface utilisateur principale
├── style.css               # Styles modernes et responsive
├── app.js                  # Logique applicative, calculs et intégration Supabase
├── schema.sql              # Script de création des tables et des règles de sécurité SQL
├── netlify.toml            # Configuration de build et redirection pour Netlify
└── README.md               # Documentation du projet
```

---

## 🚀 Installation & Déploiement

### 1. Configuration de la Base de Données (Supabase)
1. Créez un compte ou ouvrez votre projet sur [Supabase](https://supabase.com/).
2. Rendez-vous dans le **SQL Editor**.
3. Copiez le contenu du fichier `schema.sql` et cliquez sur **Run**.

### 2. Déploiement en Ligne (au choix)

#### Option A : GitHub Pages (Automatique)
1. Poussez votre code sur la branche `main` de votre dépôt GitHub.
2. Dans GitHub, allez dans **Settings** > **Pages**.
3. Dans la section **Build and deployment**, sous **Source**, choisissez **GitHub Actions**.
4. Votre application est immédiatement en ligne à l'adresse : `https://<votre-compte>.github.io/<nom-du-repo>/`.

#### Option B : Netlify
1. Connectez votre compte Netlify à votre dépôt GitHub.
2. Cliquez sur **Deploy** (le fichier `netlify.toml` configure tout automatiquement).

---

## 💻 Utilisation Locale

Vous pouvez également tester l'application directement sur votre machine sans serveur :
1. Double-cliquez simplement sur le fichier `index.html` pour l'ouvrir dans votre navigateur.
2. Connectez-vous avec vos identifiants Supabase (ou créez votre compte au premier lancement).
