# Organic — site de vente de musique (version 100% gratuite)

Site complet pour vendre ta musique en ligne : catalogue par style (Synthwave /
Musique de jeu / Ambient & Calme), aperçus audio, panier, vrai paiement par
carte bancaire via Stripe. Hébergement, base de données et stockage de
fichiers : tout est fait avec des offres gratuites, sans carte bancaire.

**La pile technique :**
- **Render** — fait tourner le serveur (gratuit, pas de carte requise, le site
  "dort" après 15 min sans visite et redémarre en ~30-60s au visiteur suivant).
- **Supabase** — stocke le catalogue et les fichiers audio/pochettes (gratuit,
  pas de carte requise, un projet inactif 7 jours se met en pause, à réveiller
  d'un clic dans le tableau de bord).
- **Stripe** — encaisse les paiements réels (gratuit à la création, une petite
  commission est juste prélevée sur chaque vente, jamais d'avance).
- **GitHub** — héberge le code pour que Render puisse le déployer (gratuit).

Coût total pour démarrer : **0 €**. La seule chose qui coûte quelque chose,
plus tard et si tu le veux, c'est un nom de domaine personnalisé — pas
obligatoire, ton site est déjà visitable et indexable sur Google avec une
adresse gratuite du type `organic.onrender.com`.

---

## Étape 1 — Créer le projet Supabase (base de données + fichiers)

1. Va sur [supabase.com](https://supabase.com), crée un compte gratuit.
2. "New project" → choisis un nom (ex: `organic`) et un mot de passe de base
   de données (garde-le de côté, tu n'en auras normalement pas besoin après).
3. Une fois le projet créé, va dans **SQL Editor** (menu de gauche) → "New
   query", colle tout le contenu du fichier `supabase-schema.sql` de ce
   projet, clique "Run". Ça crée la table qui stocke ton catalogue.
4. Va dans **Storage** (menu de gauche) → "New bucket" → nomme-le
   `organic-media` → coche **Public bucket** → crée-le.
5. Va dans **Project Settings → API**. Note deux valeurs :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **service_role key** (dans "Project API keys" — clique pour la révéler).
     ⚠️ Cette clé est secrète, ne la partage jamais, ne la mets jamais dans du
     code visible du navigateur.

## Étape 2 — Créer le compte Stripe

1. Crée un compte sur [stripe.com](https://stripe.com) (gratuit).
2. Dans le tableau de bord, récupère ta **clé secrète de test**
   (`sk_test_...`) sur [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys).
3. Avec cette clé de test, tu peux commander avec une fausse carte
   (`4242 4242 4242 4242`, date future, CVC quelconque) pour vérifier que
   tout marche, sans vrai argent.
4. Le jour où tu veux encaisser pour de vrai, Stripe te demandera de
   vérifier ton identité (formulaire dans leur interface) puis tu remplaces
   la clé par ta **clé secrète live** (`sk_live_...`).

## Étape 3 — Mettre le code sur GitHub

```bash
cd organic-shop
git init
git add .
git commit -m "Site Organic"
```

Crée un nouveau dépôt (vide, sans README) sur [github.com/new](https://github.com/new),
puis pousse le code en suivant les commandes que GitHub affiche après
création (quelque chose comme) :

```bash
git remote add origin https://github.com/TON-COMPTE/organic-shop.git
git push -u origin main
```

## Étape 4 — Déployer sur Render

1. Crée un compte sur [render.com](https://render.com) (gratuit, connecte-toi
   avec ton compte GitHub, c'est le plus simple).
2. "New +" → "Web Service" → sélectionne ton dépôt `organic-shop`.
3. Configuration :
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Dans "Environment Variables", ajoute (mêmes valeurs que ton `.env` local) :
   - `ADMIN_PASSWORD`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_BUCKET` → `organic-media`
   - `STRIPE_SECRET_KEY`
5. "Create Web Service". Render installe et lance le site — au bout de
   quelques minutes, tu as une URL du type `https://organic-xxxx.onrender.com`.

C'est en ligne. N'importe qui avec ce lien peut visiter le site, écouter les
aperçus, et acheter (en mode test tant que tu utilises `sk_test_...`).

## Étape 5 — Ajouter tes titres

Va sur ton site en ligne, clique "Espace artiste" en bas de page (mot de
passe = ton `ADMIN_PASSWORD`), puis "+ Ajouter un titre" sur chaque onglet.

## Étape 6 — Être trouvable sur Google

1. Remplace `VOTRE-DOMAINE.fr` par ta vraie adresse Render (ex:
   `organic-xxxx.onrender.com`) dans `public/robots.txt` et
   `public/sitemap.xml`, puis renvoie (`git add`, `git commit`, `git push` —
   Render redéploie automatiquement à chaque push).
2. Va sur [Google Search Console](https://search.google.com/search-console),
   ajoute ta propriété avec l'adresse de ton site, vérifie-la (Google
   propose une méthode simple pour un sous-domaine Render — en général via
   une balise HTML ou un enregistrement DNS si tu as un domaine ; pour un
   sous-domaine `onrender.com`, utilise la méthode "balise HTML" et
   colle-la dans `public/index.html`).
3. Soumets ton `sitemap.xml`.
4. L'indexation prend ensuite de quelques jours à quelques semaines — ce
   n'est jamais instantané, même une fois le site en ligne.

## Le site "dort" — comment le garder plus réactif

Le plan gratuit de Render met le site en veille après 15 minutes sans
visite. C'est normal et sans danger (tes données restent intactes sur
Supabase), juste un peu lent au réveil (~30-60s). Si ça te gêne, un service
gratuit comme [UptimeRobot](https://uptimerobot.com) peut visiter ton site
toutes les 10 minutes pour le garder éveillé.

## Sécurité — à savoir

- Le mot de passe "Espace artiste" est une protection simple, pas un vrai
  système de comptes. Suffisant si tu es seul à gérer le site.
- Les prix envoyés au paiement sont toujours recalculés côté serveur depuis
  Supabase, jamais depuis ce que le navigateur envoie — personne ne peut
  trafiquer un prix.
- La clé `SUPABASE_SERVICE_ROLE_KEY` et `STRIPE_SECRET_KEY` sont secrètes :
  elles vivent uniquement dans les variables d'environnement (Render), jamais
  dans le code poussé sur GitHub.
