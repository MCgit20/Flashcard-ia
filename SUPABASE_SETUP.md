# Configuration Supabase - Setup Instructions

Votre application flashcard-ai nécessite une configuration correcte de la base de données Supabase. Suivez ces étapes :

## 1. Accédez à votre projet Supabase
- Allez sur https://app.supabase.com
- Sélectionnez votre projet (ibwwnkplrsipbgihwdsg)

## 2. Exécutez le schéma SQL
- Cliquez sur "SQL Editor" dans le menu latéral
- Créez une nouvelle requête
- Copiez le contenu du fichier `supabase-schema.sql`
- Collez le contenu dans l'éditeur SQL
- Cliquez sur "Exécuter"

## 3. Vérifiez les permissions
Après l'exécution du schéma, vous devriez voir :
- ✅ Tables créées : `decks` et `flashcards`
- ✅ Index créés sur `deck_id` et `next_review`
- ✅ Trigger créé pour la mise à jour automatique du comptage des cartes
- ✅ Permissions accordées au service role

## 4. Testez l'application
Rafraîchissez votre navigateur sur http://localhost:3000

Si vous voyez toujours une erreur de permission, exécutez ces commandes supplémentaires dans SQL Editor :

\`\`\`sql
GRANT SELECT ON public.decks TO service_role;
GRANT SELECT ON public.flashcards TO service_role;
GRANT INSERT ON public.decks TO service_role;
GRANT INSERT ON public.flashcards TO service_role;
GRANT UPDATE ON public.flashcards TO service_role;
GRANT DELETE ON public.decks TO service_role;
\`\`\`

## Variables d'environnement
Assurez-vous que votre fichier `.env.local` contient :
- `MISTRAL_API_KEY` - Clé API Mistral
- `NEXT_PUBLIC_SUPABASE_URL` - URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé de service role Supabase

Tous ces paramètres sont déjà configurés dans votre projet.

## Support
Si vous rencontrez des problèmes :
1. Vérifiez les logs du serveur de développement
2. Assurez-vous que les tables existent dans Supabase
3. Vérifiez les permissions du service role
