'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        setLoading(false)
      }
    }

    getUser()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading...</div>
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen">

      {/* Top nav */}
      <nav className="border-b border-white/10 px-6 py-4 md:px-16 flex items-center justify-between">
        <div>
          <span className="text-saffron font-bold text-xl">JOIN</span>
          <span className="text-white font-bold text-xl"> SARKAR</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm hidden sm:block">
            {user?.user_metadata?.full_name || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-white/50 text-sm px-4 py-2 rounded-lg border border-white/10 hover:border-white/30 transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Dashboard body */}
      <div className="px-6 py-12 md:px-16 max-w-5xl">

        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-white text-3xl font-bold mb-2">
            Welcome, {user?.user_metadata?.full_name?.split(' ')[0] || 'Aspirant'} 👋
          </h1>
          <p className="text-white/50">Your AI Chief of Staff is ready. Let us get you started.</p>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-white/40 text-xs font-medium tracking-widest mb-3">ACTIVE EXAMS</div>
            <div className="text-white text-3xl font-bold">0</div>
            <div className="text-white/40 text-sm mt-1">of 3 maximum</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-white/40 text-xs font-medium tracking-widest mb-3">STUDY STREAK</div>
            <div className="text-white text-3xl font-bold">0</div>
            <div className="text-white/40 text-sm mt-1">days in a row</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-white/40 text-xs font-medium tracking-widest mb-3">HOURS LOGGED</div>
            <div className="text-white text-3xl font-bold">0</div>
            <div className="text-white/40 text-sm mt-1">total hours</div>
          </div>
        </div>

        {/* Next steps */}
        <div className="mb-6">
          <h2 className="text-white font-semibold text-lg mb-4">Get started</h2>
          <div className="space-y-3">

            <div className="bg-white/5 border border-saffron/30 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center text-saffron font-bold text-sm">1</div>
                <div>
                  <div className="text-white font-medium text-sm">Complete your profile</div>
                  <div className="text-white/40 text-xs mt-0.5">Tell us about yourself so we can personalise everything</div>
                </div>
              </div>
              <a href="/onboarding" className="text-saffron text-sm font-medium hover:underline shrink-0">
                Start →
              </a>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 font-bold text-sm">2</div>
                <div>
                  <div className="text-white font-medium text-sm">Get your exam recommendations</div>
                  <div className="text-white/40 text-xs mt-0.5">AI picks your best 3 exams based on your profile</div>
                </div>
              </div>
              <a href="/recommendations" className="text-saffron text-sm font-medium hover:underline shrink-0">
                View
              </a>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 font-bold text-sm">3</div>
                <div>
                  <div className="text-white font-medium text-sm">Generate your study plan</div>
                  <div className="text-white/40 text-xs mt-0.5">A living daily plan built around your schedule</div>
                </div>
              </div>
              <a href="/studyplan" className="text-saffron text-sm font-medium hover:underline shrink-0">
                View
              </a>
            </div>

          </div>
        </div>

      </div>
    </main>
  )
}