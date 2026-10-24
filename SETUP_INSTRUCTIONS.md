# Quick Setup Instructions

## Environment Variables

Your Supabase credentials have been configured in `env.example`. To use them locally:

1. **Create `.env.local` file** in the project root (this file is gitignored for security)

2. **Copy the contents from `env.example` to `.env.local`**:

```bash
# On Windows PowerShell:
Copy-Item env.example .env.local

# Or manually create .env.local with:
NEXT_PUBLIC_SUPABASE_URL=https://kvibxglzydsrelviurnl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_SuriIKsNFsO-fBl_elKcBw_dJ7EQcCH
```

## Supabase Project Details

- **Project URL**: https://kvibxglzydsrelviurnl.supabase.co
- **Project ID**: kvibxglzydsrelviurnl
- **Publishable Key**: sb_publishable_SuriIKsNFsO-fBl_elKcBw_dJ7EQcCH

**Note**: The secret key is not needed for this application as we use Row Level Security (RLS) with the publishable key.

## Next Steps

1. Run the SQL setup scripts from `SUPABASE_SETUP.md` in your Supabase SQL Editor
2. Create the storage bucket `lesson_pdfs` in Supabase Storage
3. Create an admin user and add them to the `user_roles` table
4. Start the dev server: `npm run dev`

## For Netlify Deployment

Add these environment variables in Netlify dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
