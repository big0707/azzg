# AZZG - AI Video Tools Platform

One-stop AI video tools platform. Access 100+ open-source AI video tools with one subscription.

## Tech Stack

- **Frontend:** Next.js 14 + TailwindCSS (deployed on Vercel)
- **Auth & Database:** Supabase (PostgreSQL + Auth + RLS)
- **Payments:** Stripe (test mode)
- **AI APIs:** OpenRouter (LLM) + Replicate/Fal.ai (video)
- **Tool Server:** Ubuntu 24.04 + Docker + Nginx (Tencent Cloud)

## Getting Started

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.local.example .env.local

# Run development server
npm run dev
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── auth/                 # Login & Register
│   ├── dashboard/            # User dashboard
│   ├── admin/                # Admin panel (user management)
│   ├── tools/                # Tool browser
│   └── api/
│       ├── proxy/openrouter/ # API proxy (protects keys)
│       ├── stripe/webhook/   # Stripe payment webhooks
│       └── admin/users/      # Admin API
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── stripe.ts             # Stripe config
└── styles/
    └── globals.css
```

## Database Setup

Run the SQL migration in Supabase SQL Editor:
`supabase/migrations/001_init.sql`

## Admin Flow

1. User registers → profile created (disabled by default)
2. User pays via Stripe → webhook updates payment_status
3. Admin enables user in /admin → user can access tools
