// WinBack lives in its own schema and bucket on the shared Supabase project.
// See docs/shared-supabase-db.md.
export const DB_SCHEMA = 'winback' as const;
export const DOCUMENTS_BUCKET = 'winback-documents' as const;
