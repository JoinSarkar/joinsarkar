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
- Resend SMTP connected (bypasses Supabase 2/hr limit)
- Email confirmation turned off for development

## Phase 3 — Onboarding & Profile Engine ✅
- Profiles table created in Supabase with RLS policies
- 5-step onboarding form built
- Fields: name, age, gender, state, language, education,
  graduation year, subject, employment, income, dependents,
  study hours, prep start, relocation, risk tolerance,
  salary target, career aspiration, family responsibilities
- Data saves correctly to Supabase on completion
- User redirected to dashboard after onboarding

## Phase 4 — Exam Recommendation Engine 🔜
- Claude AI recommends up to 3 compatible exams
- Fit score, timeline, salary range, reasoning per exam
- Three Exam Rule enforced
- Requires Anthropic API key (still pending)

## Phase 5 — Study Plan Generator 🔜
## Phase 6+ — Knowledge, Testing, Accountability 🔜

## Environment Variables
### Local (.env.local)
- NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

### Vercel (production)
- NEXT_PUBLIC_SUPABASE_URL=added
- NEXT_PUBLIC_SUPABASE_ANON_KEY=added
- ANTHROPIC_API_KEY=pending

## Known Issues
- Anthropic API key pending (Indian card not accepted — trying Wise)
- Email confirmation is OFF — turn ON before public launch
- /onboarding is not protected if user has already completed onboarding

## Stack
- Frontend: Next.js 14 (App Router) + Tailwind CSS
- Database + Auth: Supabase
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- Hosting: Vercel
- Email: Resend (connected)
- Payments: Razorpay (not yet integrated)