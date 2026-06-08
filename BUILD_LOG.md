# JOIN SARKAR — Build Log

## Phase 0 — Accounts & Credentials ✅
- GitHub: JoinSarkar account created
- Supabase: Project created, URL and anon key saved
- Vercel: Connected to GitHub, live deployment working
- Anthropic: PENDING — Indian card issue, resolving via Wise

## Phase 1 — Project Skeleton ✅
- Next.js 14 project created with App Router
- Tailwind CSS configured with brand colours
- DM Sans font imported
- Landing page built (hero, how-it-works, pricing, footer)
- Deployed live at: https://joinsarkar.vercel.app

## Phase 2 — Auth & User Management 🔜
- Supabase Auth setup
- Email/password signup and login
- Google OAuth
- Protected dashboard route

## Phase 3 — Onboarding & Profile Engine 🔜
## Phase 4 — Exam Recommendation Engine 🔜
## Phase 5 — Study Plan Generator 🔜

## Environment Variables Needed
- NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
- ANTHROPIC_API_KEY=pending

## Known Issues
- Anthropic API key pending (Indian card not accepted)
- /login and /signup pages not built yet (links exist on landing page)

## Stack
- Frontend: Next.js 14 (App Router) + Tailwind CSS
- Database + Auth: Supabase
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- Hosting: Vercel
- Payments: Razorpay (not yet integrated)
- Email: Resend (not yet integrated)