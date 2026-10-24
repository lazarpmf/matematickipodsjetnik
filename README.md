# Maths Reminder App

A Next.js application for managing and viewing mathematical lesson cards with PDF support.

## Features

- **Public Access**: Users can search, view, print, and download lesson PDFs
- **Admin Panel**: Admins can add, edit, and delete lesson cards
- **Responsive Design**: Optimized for laptop (4 cards), tablet (2-3 cards), and phone (1 card)
- **Search & Filter**: Search by title and filter by grade (6-9)
- **Metrics**: Admin can view visit counts and storage usage
- **QR Drop**: `/qr` opens a shared code. Either the computer or the phone can send one file; it is deleted as soon as the other device downloads it, or after 60 minutes.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Storage)
- **Deployment**: Netlify

## Setup

### Prerequisites

- Node.js 20+
- A Supabase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL scripts from `SUPABASE_SETUP.md` in your Supabase SQL Editor
   - Create the storage bucket `lesson_pdfs` and configure policies
   - Create an admin user and add them to the `user_roles` table

4. Configure environment variables:
   - Copy `env.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
     NEXT_PUBLIC_SITE_URL=https://your-domain.example
     ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Netlify

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. In Netlify:
   - Go to "Add new site" > "Import an existing project"
   - Connect your repository
   - Netlify will auto-detect Next.js settings

3. Configure environment variables in Netlify:
   - Go to Site settings > Environment variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Deploy:
   - Netlify will automatically build and deploy on push
   - Or trigger a manual deploy from the Netlify dashboard

## Project Structure

```
├── app/
│   ├── (components)/     # React components
│   │   ├── Navbar.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Card.tsx
│   │   ├── CardGrid.tsx
│   │   ├── CardModal.tsx
│   │   ├── AdminBar.tsx
│   │   ├── LessonForm.tsx
│   │   └── ConfirmDialog.tsx
│   ├── actions/           # Server actions
│   │   ├── lessons.ts
│   │   └── metrics.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/                   # Utilities
│   ├── supabaseClient.ts
│   ├── auth.ts
│   ├── types.ts
│   ├── validators.ts
│   ├── metrics.ts
│   └── storage.ts
├── netlify.toml          # Netlify configuration
├── SUPABASE_SETUP.md     # Database setup instructions
└── DEV_PLAN.md           # Development plan reference
```

## Admin Access

- Admins are manually added to the database
- Use the "Admin Login" button (bottom-right) to sign in
- After login, admins can:
  - Add new lesson cards
  - Edit existing cards
  - Delete cards
  - View visit statistics
  - View storage usage
  - Change password

## License

Private project
