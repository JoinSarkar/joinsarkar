'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function StudyPlanPage() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeDay, setActiveDay] = useState('Monday')
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadPlan() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: existing } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        setPlan(existing.plan_data)
        setSaved(true)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('study_hours_per_day')
        .eq('id', user.id)
        .single()

      const { data: exams } = await supabase
        .from('exam_recommendations')
        .select('exam_name')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (!exams || exams.length === 0) {
        router.push('/recommendations')
        return
      }

      const examNames = exams.map(e => e.exam_name)
      const hoursPerDay = profile?.study_hours_per_day || 4

      const response = await fetch('/api/studyplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exams: examNames, hoursPerDay }),
      })

      const data = await response.json()
      if (data.error) { setError('Failed to generate plan.'); setLoading(false); return }
      setPlan(data.plan)
      setLoading(false)
    }
    loadPlan()
  }, [])

  async function savePlan() {
    setSaving(true)
    const supabase = createClient()

    const { data: existing } = await supabase
      .from('study_plans')
      .select('version')
      .eq('user_id', user.id)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = existing ? existing.version + 1 : 1

    await supabase.from('study_plans').update({ is_active: false }).eq('user_id', user.id)

    const { error } = await supabase.from('study_plans').insert({
      user_id: user.id,
      version: nextVersion,
      exams: plan.exams,
      study_hours_per_day: plan.hours_per_day,
      plan_data: plan,
      is_active: true,
    })

    if (error) { setError('Failed to save plan.') } else { setSaved(true) }
    setSaving(false)
  }

  async function regenerate() {
    setLoading(true)
    setSaved(false)
    const supabase = createClient()
    await supabase.from('study_plans').update({ is_active: false }).eq('user_id', user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('study_hours_per_day')
      .eq('id', user.id)
      .single()

    const { data: exams } = await supabase
      .from('exam_recommendations')
      .select('exam_name')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const response = await fetch('/api/studyplan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exams: exams.map(e => e.exam_name),
        hoursPerDay: profile?.study_hours_per_day || 4,
      }),
    })

    const data = await response.json()
    setPlan(data.plan)
    setLoading(false)
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Building your study plan...</p>
      </main>
    )
  }

  if (!plan) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">No plan found. Please complete onboarding first.</p>
      </main>
    )
  }

  const todayPlan = plan.weekly_plan?.find(d => d.day === activeDay)

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen px-6 py-12 md:px-16">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10">
          <a href="/dashboard">
            <span className="text-saffron font-bold text-xl">JOIN</span>
            <span className="text-white font-bold text-xl"> SARKAR</span>
          </a>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold mb-1">Your study plan</h1>
              <p className="text-white/50 text-sm">
                {plan.hours_per_day} hours/day across {plan.exams?.join(', ')}
              </p>
            </div>
            <button onClick={regenerate} className="text-white/40 text-xs border border-white/10 px-3 py-2 rounded-lg hover:border-white/30 transition-colors shrink-0">
              Regenerate
            </button>
          </div>
        </div>

        <div className="bg-saffron/5 border border-saffron/20 rounded-2xl p-4 mb-8">
          <p className="text-saffron/80 text-xs leading-relaxed">
            <span className="font-semibold">Daily tip:</span> {plan.tip}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-white font-semibold mb-4">Daily routine</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.daily_routine?.morning && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-saffron text-xs font-bold tracking-widest mb-2">MORNING</div>
                <p className="text-white/70 text-sm">{plan.daily_routine.morning}</p>
              </div>
            )}
            {plan.daily_routine?.afternoon && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-saffron text-xs font-bold tracking-widest mb-2">AFTERNOON</div>
                <p className="text-white/70 text-sm">{plan.daily_routine.afternoon}</p>
              </div>
            )}
            {plan.daily_routine?.evening && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-saffron text-xs font-bold tracking-widest mb-2">EVENING</div>
                <p className="text-white/70 text-sm">{plan.daily_routine.evening}</p>
              </div>
            )}
            {plan.daily_routine?.night && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-saffron text-xs font-bold tracking-widest mb-2">NIGHT</div>
                <p className="text-white/70 text-sm">{plan.daily_routine.night}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-white font-semibold mb-4">Weekly schedule</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {plan.weekly_plan?.map(d => (
              <button
                key={d.day}
                onClick={() => setActiveDay(d.day)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeDay === d.day
                    ? 'bg-saffron text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {d.day.slice(0, 3)}
              </button>
            ))}
          </div>

          {todayPlan && (
            <div className="space-y-3">
              {todayPlan.type === 'revision' ? (
                <div className="bg-teal/10 border border-teal/20 rounded-2xl p-5">
                  <div className="text-teal text-xs font-bold tracking-widest mb-3">REVISION DAY</div>
                  {todayPlan.sessions.map((s, i) => (
                    <div key={i}>
                      <p className="text-white font-medium text-sm mb-1">{s.title}</p>
                      <p className="text-white/60 text-sm">{s.activity}</p>
                    </div>
                  ))}
                </div>
              ) : (
                todayPlan.sessions.map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-saffron text-xs font-bold tracking-widest">{s.title.toUpperCase()}</span>
                      <span className="text-white/40 text-xs">{s.duration}</span>
                    </div>
                    <p className="text-white font-medium text-sm mb-1">{s.subject}</p>
                    <p className="text-white/60 text-sm">{s.activity}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="mb-10">
          <h2 className="text-white font-semibold mb-4">Monthly milestones</h2>
          <div className="space-y-3">
            {plan.monthly_milestones?.map((m, i) => (
              <div key={i} className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-saffron/10 border border-saffron/20 flex items-center justify-center">
                  <span className="text-saffron text-xs font-bold">W{m.week}</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed self-center">{m.goal}</p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          {!saved ? (
            <button
              onClick={savePlan}
              disabled={saving}
              className="flex-1 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save this plan'}
            </button>
          ) : (
            <a href="/dashboard" className="flex-1 bg-teal text-white font-semibold py-3 rounded-xl hover:bg-teal/90 transition-colors text-center">
              Plan saved - go to dashboard
            </a>
          )}
        </div>

      </div>
    </main>
  )
}
