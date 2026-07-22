# Active Infrastructure

This folder is reserved for active infrastructure configuration.

Current production setup:

- Frontend: AWS Amplify, configured by the root `amplify.yml`.
- Backend: Railway, configured by the root `Dockerfile`, `Procfile`, and `nixpacks.toml`.
- Data/Auth: Supabase, configured by `docs/supabase-schema.sql` and environment variables.

AWS ECS and Render experiments are archived in `legacy/deployment-experiments/`.
