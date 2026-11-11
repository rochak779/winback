<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Database: shared Supabase project

WinBack runs on the shared `Rochak's Hobby` Supabase project, inside its own `winback` schema. Read and follow [`docs/shared-supabase-db.md`](docs/shared-supabase-db.md) before touching the database. In short: everything goes in schema `winback`, storage uses the `winback-documents` bucket, migrations are applied **only** with `pnpm db:migrate`, and `supabase db push` / `db reset --linked` / `db pull` / `link` are never run against the shared project.
