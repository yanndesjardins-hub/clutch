# 🏀 Hoops Cup — Mode Opératoire

> App de pronostics NBA Playoffs 2026 pour groupes de potes.

---

## 1. Prérequis

- [Node.js](https://nodejs.org/) v18+ installé
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [BallDontLie](https://www.balldontlie.io) (gratuit)
- Un compte [GitHub](https://github.com) pour le déploiement

---

## 2. Installation en local

```bash
# Dans VS Code, ouvre le dossier hoops-cup puis lance :
npm install
```

---

## 3. Configurer Supabase (5 min)

1. Va sur [supabase.com](https://supabase.com) → **New project**
2. Choisis un nom, un mot de passe, la région **EU West**
3. Une fois le projet créé → **SQL Editor** (menu gauche)
4. Colle le contenu de `supabase/schema.sql` → clique **Run**
5. Va dans **Settings → API** et copie :
   - `Project URL` → c'est ta `VITE_SUPABASE_URL`
   - `anon public` key → c'est ta `VITE_SUPABASE_ANON_KEY`

> ✅ **Activer la confirmation email optionnelle** (recommandé pour tests) :
> Authentication → Providers → Email → désactive "Confirm email"

---

## 4. Configurer BallDontLie (2 min)

1. Va sur [balldontlie.io](https://www.balldontlie.io) → Sign up gratuit
2. Copie ta clé API → c'est ta `VITE_BALLDONTLIE_KEY`

---

## 5. Créer le fichier `.env`

À la racine du projet, duplique `.env.example` en `.env` :

```bash
cp .env.example .env
```

Puis remplis les 3 valeurs :

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_BALLDONTLIE_KEY=ta_clé
```

---

## 6. Lancer en local

```bash
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173) — l'app tourne !

---

## 7. Déployer sur Netlify (ou Vercel)

### Option A — Netlify (recommandé)

1. Push le projet sur GitHub : `git init` → `git add .` → `git commit -m "init"` → `git push`
2. Va sur [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Sélectionne ton repo GitHub
4. Build command : `npm run build`
5. Publish directory : `dist`
6. **Environment variables** → ajoute tes 3 variables `.env`
7. **Deploy site** → ton app est en ligne 🎉

### Option B — Vercel

1. Va sur [vercel.com](https://vercel.com) → **Add New Project**
2. Importe ton repo GitHub
3. Framework : **Vite**
4. Ajoute les 3 variables d'environnement
5. **Deploy** 🚀

---

## 8. ⚠️ Modifier la deadline des pronos initiaux

Dans le fichier `src/lib/constants.js`, **ligne 5** :

```js
export const PLAYOFF_DEADLINE = new Date('2026-04-20T23:59:59+02:00')
```

Change la date selon tes besoins → save → `git push` → redéploiement automatique.
**Les données des utilisateurs ne sont pas affectées.**

---

## 9. Mettre à jour sans perdre les données

Toutes les données sont dans **Supabase**, pas dans le code.
Donc à chaque mise à jour :

```bash
git add .
git commit -m "ma modification"
git push
```

Netlify/Vercel redéploie automatiquement en 1-2 min.
**Aucune donnée perdue.** ✅

---

## 10. Partager avec ton groupe WhatsApp

1. Crée ton compte sur l'app
2. Crée un groupe (ex: "Les Experts 🏀")
3. Clique **📲 Partager** → copie le lien
4. Colle le lien dans ton groupe WhatsApp

Tes amis cliquent → créent leur compte → rejoignent automatiquement le groupe.

---

## Structure du projet

```
src/
  lib/
    constants.js   ← ⚠️ deadline + équipes + scoring
    supabase.js    ← client Supabase
    nbaApi.js      ← scores live BallDontLie
    scoring.js     ← calcul des points
  context/
    AuthContext.jsx
  pages/
    Login.jsx      ← connexion / inscription
    GroupHub.jsx   ← mes groupes
    PlayoffView.jsx← bracket visuel
    SeriesView.jsx ← liste des séries
    Rankings.jsx   ← classement
    Rules.jsx      ← règles
  components/
    Navbar.jsx
    BracketSlot.jsx
    PredictionModal.jsx
supabase/
  schema.sql       ← tables à créer dans Supabase
```

---

## En cas de problème

| Erreur | Solution |
|--------|----------|
| `Variables manquantes` | Vérifie ton `.env` et relance `npm run dev` |
| Écran blanc au déploiement | Vérifie les env vars dans Netlify/Vercel |
| `BallDontLie 401` | Vérifie ta clé API BallDontLie dans `.env` |
| Connexion impossible | Dans Supabase → Auth → désactive la confirmation email |
| RLS error | Vérifie que tu as bien exécuté le `schema.sql` en entier |
