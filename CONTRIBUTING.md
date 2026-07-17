# Contributing

Pr3ply Feature Lab is maintained as a product portfolio project. External contributions are not actively solicited, but issues and suggestions are welcome.

## Ground rules

- Do not edit auto-generated files: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `.env`, `supabase/config.toml`.
- Every new public-schema table must ship with RLS enabled and explicit `GRANT`s in the same migration.
- Never commit environment files, project identifiers, credentials, keys, or tokens.
- Roles live in `public.user_roles`; use the `has_role` security-definer function for policy checks.

## Reporting issues

Open a GitHub issue with reproduction steps and the affected route/component.
