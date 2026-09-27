# AI Finance OS

Fondation du copilote financier intelligent pour PME et TPE.

## Phase actuelle

La phase 2 ajoute le socle Supabase SSR, les parcours d’authentification, le middleware de protection, la migration multi-tenant RLS et les routes privées principales. Les fonctions métier qui ne sont pas encore reliées à la base sont explicitement signalées comme indisponibles dans l’interface.

Routes disponibles :

- `/` : présentation publique et navigation vers l’espace
- `/dashboard` : espace vide responsive avec état de préparation, session et déconnexion Supabase
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` : parcours Supabase Auth
- `/invoices`, `/documents`, `/settings` et autres routes privées : destinations protégées avec état d’attente

La migration SQL se trouve dans `supabase/migrations/001_initial.sql`. Elle doit être appliquée au projet Supabase avant d’utiliser les tables et le Storage.

## Développement

```bash
npm install
npm run dev
```

Vérifications disponibles :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Prochaine phase

Les prochaines étapes sont l’application de la migration, la création d’entreprise, puis les CRUD documents/factures et les tests d’autorisation. Aucune clé ou variable d’environnement réelle n’est versionnée ; voir `.env.example`.