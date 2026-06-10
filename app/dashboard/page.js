'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [exams, setExams] = useState([])
  const [todayCheckin, setTodayCheckin] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const [statsRes, examsRes, checkinRes] = await Promise.all([
        supabase.from('study_stats').select('*').eq('user_id', user.id).single(),
        supabase.from('exam_recommendations').select('exam_name, fit_score').eq('user_id', user.id).eq('is_active', true),
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('date', today).single(),
      ])
      setStats(statsRes.data)
      setExams(examsRes.data || [])
      setTodayCheckin(checkinRes.data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  const links = [
    { num: '1', title: 'Complete your profile', desc: 'Tell us about yourself so we can personalise everything', href: '/onboarding', label: 'Edit', highlight: true },
    { num: '2', title: 'Exam recommendations', desc: 'Your personalised exam shortlist', href: '/recommendations', label: 'View', highlight: false },
    { num: '3', title: 'Study plan', desc: 'Your daily and weekly schedule', href: '/studyplan', label: 'View', highlight: false },
    { num: '4', title: 'Daily check-in', desc: 'Log your hours, mood, and mock scores', href: '/checkin', label: null, highlight: false },
    { num: '5', title: 'Current Affairs', desc: 'Daily news with MCQs for exam prep', href: '/currentaffairs', label: 'Read today', highlight: false },
    { num: '6', title: 'Exam tracker', desc: 'Notifications, deadlines, admit cards, results', href: '/notifications', label: 'View', highlight: false },
    { num: '7', title: 'Answer Writing', desc: 'Advanced Track — evaluate and improve your answers', href: '/answerwriting', label: 'Practice', highlight: false },
    { num: '8', title: 'Subscription', desc: 'Manage your plan', href: '/pricing', label: 'View', highlight: false },
  ]

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen">
      <nav className="border-b border-white/10 px-6 py-4 md:px-16 flex items-center justify-between">
        <div>
          <span className="text-saffron font-bold text-xl">JOIN</span>
          <span className="text-white font-bold text-xl"> SARKAR</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm hidden sm:block">{user?.user_metadata?.full_name || user?.email}</span>
          <button onClick={handleLogout} className="text-white/50 text-sm px-4 py-2 rounded-lg border border-white/10 hover:border-white/30 transition-colors">Log out</button>
        </div>
      </nav>

      <div className="px-6 py-12 md:px-16 max-w-5xl">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-white text-3xl font-bold mb-2">Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Aspirant'} 👋</h1>
            <p className="text-white/50">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          {!todayCheckin?.checked_in
            ? <a href="/checkin" className="shrink-0 bg-saffron text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-saffron/90 transition-colors">Check in today</a>
            : <a href="/checkin" className="shrink-0 bg-teal/20 text-teal text-sm font-semibold px-4 py-2 rounded-xl border border-teal/30 hover:bg-teal/30 transition-colors">Checked in today</a>
          }
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{exams.length}</div>
            <div className="text-white/40 text-xs mt-1">Active exams</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{stats?.current_streak || 0}</div>
            <div className="text-white/40 text-xs mt-1">Day streak</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{stats?.total_hours?.toFixed(0) || 0}</div>
            <div className="text-white/40 text-xs mt-1">Hours logged</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{stats?.total_days_studied || 0}</div>
            <div className="text-white/40 text-xs mt-1">Days studied</div>
          </div>
        </div>

        {exams.length > 0 && (
          <div className="mb-10">
            <h2 className="text-white font-semibold text-lg mb-4">Your active exams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {exams.map((exam, i) => (
                <div key={exam.exam_name} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium text-sm">{exam.exam_name}</div>
                    {i === 0 && <div className="text-saffron text-xs mt-0.5">Best fit</div>}
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-saffron flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{exam.fit_score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {todayCheckin?.checked_in && (
          <div className="mb-10 bg-teal/5 border border-teal/20 rounded-2xl p-5">
            <div className="text-teal text-xs font-bold tracking-widest mb-3">TODAY AT A GLANCE</div>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <div className="text-white/40 text-xs">Hours studied</div>
                <div className="text-white font-bold text-lg">{todayCheckin.study_hours_logged}h</div>
              </div>
              {todayCheckin.mood && <div><div className="text-white/40 text-xs">Mood</div><div className="text-white font-bold text-lg">{todayCheckin.mood}</div></div>}
              {todayCheckin.mock_attempted && <div><div className="text-white/40 text-xs">Mock score</div><div className="text-white font-bold text-lg">{todayCheckin.mock_score}%</div></div>}
              {todayCheckin.topics_covered?.length > 0 && <div><div className="text-white/40 text-xs">Topics covered</div><div className="text-white text-sm">{todayCheckin.topics_covered.join(', ')}</div></div>}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-white font-semibold text-lg mb-4">Quick links</h2>
          <div className="space-y-3">
            {links.map(link => (
              <div key={link.num} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${link.highlight ? 'bg-saffron/20 text-saffron' : 'bg-white/10 text-white/50'}`}>{link.num}</div>
                  <div>
                    <div className="text-white font-medium text-sm">{link.title}</div>
                    <div className="text-white/40 text-xs mt-0.5">{link.desc}</div>
                  </div>
                </div>
                <a href={link.href} className="text-saffron text-sm font-medium hover:underline shrink-0">
                  {link.num === '4' ? (todayCheckin?.checked_in ? 'Update' : 'Check in') : link.label}
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}