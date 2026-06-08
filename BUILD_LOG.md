# JOIN SARKAR — Build Log

## Phase 0 — Accounts & Credentials ✅
- GitHub: JoinSarkar account created
- Supabase: Project created, URL and anon key saved
- Vercel: Connected to GitHub, live deployment working
- Resend: Account created, SMTP connected to Supabase
- Anthropic: PENDING — Indian card issue, resolving via Wise

## Phase 1 — Project Skeleton ✅
- Next.js 14 project created with App Router
- Tailwind CSS configured with brand colours
- DM Sans font imported
- Landing page built (hero, how-it-works, pricing, footer)
- Deployed live at: https://joinsarkar.vercel.app

## Phase 2 — Auth & User Management ✅
- Supabase Auth connected
- Email/password signup working
- Login working
- Protected dashboard built
- Resend SMTP connected
- Email confirmation off for development

## Phase 3 — Onboarding & Profile Engine ✅
- Profiles table created in Supabase with RLS policies
- 5-step onboarding form built
- All profile fields saving correctly to Supabase

## Phase 4 — Exam Recommendation Engine ✅
- Exam recommendations table created in Supabase
- Mock AI engine with profile-based scoring
- Recommendation cards with fit scores, salary ranges, reasoning
- Three Exam Rule enforced
- Save to Supabase working
- Dashboard link unlocked

## Phase 5 — Study Plan Generator ✅
- Study plans table created in Supabase
- Mock AI engine generates weekly plan based on exams and hours
- Day-by-day session view with subject and activity
- Daily routine breakdown (morning/afternoon/evening/night)
- Monthly milestones (4 weeks)
- Save to Supabase with version history
- Regenerate option working
- Dashboard link unlocked

## Phase 6 — Daily Check-in & Accountability 🔜
## Phase 7 — Admin Assistant (exam notifications) 🔜
## Phase 8 — Payments (Razorpay) 🔜
## Phase 9 — Real Claude AI (swap mock engines) 🔜

## Environment Variables
### Local (.env.local)
- NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

### Vercel (production)
- NEXT_PUBLIC_SUPABASE_URL=added
- NEXT_PUBLIC_SUPABASE_ANON_KEY=added
- ANTHROPIC_API_KEY=pending

## Known Issues
- Anthropic API key pending
- Email confirmation is OFF — turn ON before public launch
- Mock AI engines in use — swap to Claude API when key arrives

## Stack
- Frontend: Next.js 14 (App Router) + Tailwind CSS
- Database + Auth: Supabase
- AI: Anthropic Claude API (pending — mock engine in use)
- Hosting: Vercel
- Email: Resend (connected)
- Payments: Razorpay (not yet integrated)