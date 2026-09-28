# Les Résidences Janis — site avec espace administrateur

Ce projet contient :
- une page publique qui liste les studios (photo, quartier, prix, description) avec un bouton "Réserver via WhatsApp"
- un espace `/admin` avec connexion, pour ajouter, modifier, masquer ou supprimer un studio (avec upload de photo)

Aucune connaissance en programmation n'est nécessaire pour suivre les étapes ci-dessous, mais elles demandent un peu de temps la première fois. Si vous préférez, vous pouvez aussi confier ce dossier à un développeur : il aura tout le nécessaire pour le mettre en ligne rapidement.

## Étape 1 — Créer le projet Supabase (base de données + connexion + photos)

1. Allez sur https://supabase.com et créez un compte gratuit.
2. Cliquez sur "New project". Choisissez un nom (ex. `residences-janis`) et un mot de passe pour la base (notez-le).
3. Une fois le projet créé, ouvrez **SQL Editor** dans le menu de gauche, cliquez sur **New query**.
4. Copiez tout le contenu du fichier `supabase-setup.sql` (fourni dans ce dossier), collez-le, puis cliquez sur **Run**.

   *Si vous aviez déjà exécuté une version précédente de ce script : ce n'est pas un problème, ré-exécutez simplement la version à jour — les parties déjà en place sont ignorées, et la nouvelle table `indisponibilites` (gestion des dates occupées) sera créée.*
5. Allez dans **Storage** (menu de gauche) : vérifiez qu'un bucket nommé `studio-photos` existe et qu'il est marqué **Public**. (Le script de l'étape 4 le crée normalement automatiquement.)
6. Allez dans **Authentication > Users**, cliquez sur **Add user**, et créez le compte de l'administrateur (votre email + un mot de passe). C'est ce compte qui se connectera sur `/admin`.
7. Allez dans **Project Settings > API**. Notez les deux valeurs :
   - **Project URL**
   - **anon public key**

## Étape 2 — Configurer le projet

1. Dans ce dossier, dupliquez le fichier `.env.local.example` et renommez la copie `.env.local`.
2. Remplissez-le avec les valeurs de l'étape 1 :
   ```
   NEXT_PUBLIC_SUPABASE_URL=... (Project URL)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=... (anon public key)
   NEXT_PUBLIC_WHATSAPP_NUMBER=2290161661212
   ```

## Étape 3 — Mettre le code en ligne sur GitHub

1. Créez un compte gratuit sur https://github.com si vous n'en avez pas.
2. Créez un nouveau dépôt (repository), par exemple `residences-janis`.
3. Mettez-y tout le contenu de ce dossier (via l'interface web "upload files", ou avec `git` si vous êtes à l'aise).
   - Important : ne mettez PAS le fichier `.env.local` sur GitHub (il contient vos identifiants). Vous les ajouterez directement dans Vercel à l'étape suivante.

## Étape 4 — Héberger le site avec Vercel (gratuit)

1. Allez sur https://vercel.com et créez un compte (vous pouvez vous connecter directement avec votre compte GitHub).
2. Cliquez sur **Add New > Project**, puis choisissez le dépôt GitHub créé à l'étape 3.
3. Dans les réglages du projet, ouvrez **Environment Variables** et ajoutez les 3 mêmes variables que dans `.env.local` (mêmes noms, mêmes valeurs).
4. Cliquez sur **Deploy**. Après une à deux minutes, Vercel vous donne une adresse du type `https://residences-janis.vercel.app` — votre site est en ligne.
5. Vous pourrez ensuite relier un nom de domaine personnalisé (ex. `residencesjanis.com`) depuis les réglages Vercel du projet, si vous en achetez un.

## Utilisation au quotidien

- Site public : l'adresse donnée par Vercel (ou votre nom de domaine).
- Connexion administrateur : la même adresse suivie de `/admin` (ex. `https://residences-janis.vercel.app/admin`), avec l'email et le mot de passe créés à l'étape 1.6.
- Depuis l'espace admin, vous pouvez ajouter un studio (titre, quartier, prix, description, photo), le modifier, le masquer temporairement (sans le supprimer) ou le supprimer.
- Bouton **"Gérer les dates"** sur chaque studio : ajoutez une période pendant laquelle il est déjà réservé (du ... au ...). Le site public affiche alors automatiquement "Occupé — libre à partir du ..." et bloque la réservation si le client choisit des dates qui tombent dans cette période, en lui proposant la prochaine date libre.
- Chaque studio affiché sur le site public a un bouton "Réserver via WhatsApp" qui envoie un message pré-rempli (avec les dates choisies) à votre numéro.

## Si vous êtes bloqué

Toutes les étapes ci-dessus se font par simples clics sur les sites de Supabase, GitHub et Vercel — aucune ligne de commande n'est obligatoire. Si une étape ne fonctionne pas comme décrit (les interfaces de ces outils évoluent), montrez le message d'erreur à un développeur ou revenez avec la question précise.
