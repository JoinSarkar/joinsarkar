import Link from 'next/link'
export default function Home() {
  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen">

      <nav className="flex items-center justify-between px-6 py-4 md:px-16">
        <div>
          <span className="text-saffron font-bold text-xl tracking-wide">JOIN</span>
          <span className="text-white font-bold text-xl tracking-wide"> SARKAR</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="text-white text-sm px-4 py-2 rounded-lg border border-white/20 hover:border-white/50 transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="text-white text-sm px-4 py-2 rounded-lg bg-saffron hover:bg-saffron/90 transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      <section className="px-6 pt-20 pb-24 md:px-16 md:pt-32">
        <div className="max-w-3xl">
          <div className="inline-block bg-saffron/10 border border-saffron/30 text-saffron text-xs font-medium px-3 py-1 rounded-full mb-6">
            AI-Powered Sarkari Naukri Preparation
          </div>
          <h1 className="text-white text-4xl md:text-6xl font-bold leading-tight mb-6">
            Your job is to study.{' '}
            <span className="text-saffron">Everything else</span>{' '}
            is handled.
          </h1>
          <p className="text-white/60 text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
            Join Sarkar is your AI Chief of Staff for government job preparation.
            Exam recommendations, study plans, mock tests, and daily accountability — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup" className="bg-saffron text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-saffron/90 transition-colors text-center">
              Start for free
            </Link>
            <a href="#how-it-works" className="text-white/70 text-base px-8 py-4 rounded-xl border border-white/10 hover:border-white/30 transition-colors text-center">
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-10 md:px-16">
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-16">
          <div>
            <div className="text-saffron text-3xl font-bold">3</div>
            <div className="text-white/50 text-sm mt-1">Exams max — the Three Exam Rule</div>
          </div>
          <div>
            <div className="text-saffron text-3xl font-bold">AI</div>
            <div className="text-white/50 text-sm mt-1">Personalised study plans</div>
          </div>
          <div>
            <div className="text-saffron text-3xl font-bold">100%</div>
            <div className="text-white/50 text-sm mt-1">Evidence-based motivation</div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-white/10 px-6 py-20 md:px-16">
        <h2 className="text-white text-2xl md:text-3xl font-bold mb-12">How Join Sarkar works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-saffron text-xs font-bold tracking-widest mb-4">STEP 01</div>
            <h3 className="text-white font-semibold text-lg mb-2">Tell us about yourself</h3>
            <p className="text-white/50 text-sm leading-relaxed">Age, education, available hours, home state, salary target. One honest profile — no fluff.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-saffron text-xs font-bold tracking-widest mb-4">STEP 02</div>
            <h3 className="text-white font-semibold text-lg mb-2">Get your exam shortlist</h3>
            <p className="text-white/50 text-sm leading-relaxed">The AI recommends up to 3 compatible exams with fit scores, timelines, and salary ranges.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-saffron text-xs font-bold tracking-widest mb-4">STEP 03</div>
            <h3 className="text-white font-semibold text-lg mb-2">Follow your living plan</h3>
            <p className="text-white/50 text-sm leading-relaxed">A daily study plan that adapts when life happens. Misses a mock? The plan adjusts.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-20 md:px-16">
        <h2 className="text-white text-2xl md:text-3xl font-bold mb-4">Simple pricing</h2>
        <p className="text-white/50 mb-12">No hidden fees. Cancel anytime.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold text-lg">Objective Track</h3>
            <p className="text-white/50 text-sm mt-1 mb-4">SSC, Banking, Railways and all objective exams</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-white text-4xl font-bold">Rs. 299</span>
              <span className="text-white/40 text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center gap-2 text-white/70 text-sm"><span className="text-teal">✓</span> Exam recommendations</li>
              <li className="flex items-center gap-2 text-white/70 text-sm"><span className="text-teal">✓</span> Study plan</li>
              <li className="flex items-center gap-2 text-white/70 text-sm"><span className="text-teal">✓</span> Mock tests</li>
              <li className="flex items-center gap-2 text-white/70 text-sm"><span className="text-teal">✓</span> Daily current affairs</li>
              <li className="flex items-center gap-2 text-white/70 text-sm"><span className="text-teal">✓</span> Accountability tracking</li>
            </ul>
            <Link href="/signup" className="block text-center py-3 rounded-xl font-semibold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors">
              Get started
            </Link>
          </div>
          <div className="bg-saffron/10 border border-saffron/40 rounded-2xl p-6">
            <div className="text-saffron text-xs font-bold tracking-widest mb-4">MOST POPULAR</div>
            <h3 className="text-white font-bold text-lg">Advanced Track</h3>
            <p className="text-white/50 text-sm mt-1 mb-4">UPSC, State PCS, Judiciary — descriptive prep included</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-white text-4xl font-bold">Rs. 499</span>
              <span className="text-white/40 text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center gap-2 text-white/70 text-sm"><span className="text-teal">✓</span> Everything in Objective</li>
              <li className="flex items-center gap-2 text-white/70 text-sm"><span className="text-teal">✓</span> Mains answer writing</li>
              <li className="flex items-center gap-2 text-white/70 text-sm"><span className="text-teal">✓</span> Essay feedback</li>
              <li className="flex items-center gap-2 text-white/70 text-sm"><span className="text-teal">✓</span> Interview preparation</li>
              <li className="flex items-center gap-2 text-white/70 text-sm"><span className="text-teal">✓</span> Priority support</li>
            </ul>
            <Link href="/signup" className="block text-center py-3 rounded-xl font-semibold text-sm bg-saffron text-white hover:bg-saffron/90 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 md:px-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-saffron font-bold">JOIN</span>
            <span className="text-white font-bold"> SARKAR</span>
            <span className="text-white/30 text-sm ml-3">Your AI Chief of Staff</span>
          </div>
          <p className="text-white/30 text-sm">2025 Join Sarkar. All rights reserved.</p>
        </div>
      </footer>

    </main>
  )
}