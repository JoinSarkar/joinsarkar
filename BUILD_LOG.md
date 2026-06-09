# JOIN SARKAR - Build Log

## STATUS: COMPLETE

Live URL: https://joinsarkar.vercel.app

## All Phases

### Phase 0 - Accounts and Credentials
- GitHub, Supabase, Vercel, Resend, Anthropic, Razorpay all set up

### Phase 1 - Landing Page
- Next.js 14 + Tailwind CSS
- Brand design system (saffron, ink, teal, DM Sans)
- Landing page with hero, pricing, how-it-works

### Phase 2 - Auth
- Supabase Auth with email/password
- Signup, login, logout
- Protected dashboard
- Resend SMTP connected

### Phase 3 - Onboarding and Profile Engine
- Profiles table in Supabase with RLS
- 5-step onboarding form
- All profile data saving correctly

### Phase 4 - Exam Recommendation Engine
- Claude AI recommends 3 compatible exams
- Fit scores, salary ranges, career outcomes
- Three Exam Rule enforced
- Saved to Supabase

### Phase 5 - Study Plan Generator
- Claude AI generates weekly study plan
- Day-by-day sessions with subjects and activities
- Daily routine and monthly milestones
- Version history in Supabase

### Phase 6 - Daily Check-in and Accountability
- Morning check-in with mood, hours, topics, mock score
- Streak tracking and total hours
- Last 7 days history
- Live stats on dashboard

### Phase 7 - Real Claude AI
- claude-sonnet-4-6 powering recommendations and study plans
- Personalised reasoning per user profile

### Phase 8 - Payments
- Razorpay integrated (test mode)
- Rs 299 Objective and Rs 499 Advanced plans
- Payment verification and subscription stored in Supabase

### Phase 9 - Exam Notification Tracker
- Track notifications, deadlines, admit cards, results
- Pin, mark read, delete entries
- Days-left countdown badges
- Filter by type

## Pre-Launch Checklist
- [ ] Turn email confirmation ON in Supabase
- [ ] Switch Razorpay to live mode
- [ ] Complete Razorpay KYC
- [ ] Add custom domain in Vercel
- [ ] Add privacy policy and terms pages

## Environment Variables
### Local (.env.local)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ANTHROPIC_API_KEY
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- NEXT_PUBLIC_RAZORPAY_KEY_ID

### Vercel (all above added)

## Stack
- Frontend: Next.js 14 App Router + Tailwind CSS
- Database + Auth: Supabase
- AI: Anthropic Claude (claude-sonnet-4-6)
- Hosting: Vercel
- Email: Resend
- Payments: Razorpay
