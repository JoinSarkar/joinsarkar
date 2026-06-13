'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { calculateXPForCheckin, checkMilestones, MILESTONES } from '../../lib/gameEngine'

const MOODS = [
  { emoji: '🔥', label: 'Focused' },
  { emoji: '😊', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'Struggling' },
  { emoji: '😴', label: 'Tired' },
]

export default function CheckinPage() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [todayCheckin, setTodayCheckin] = useState(null)
  const [recentCheckins, setRecentCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    mood: '',
    study_hours_logged: '',
    topics_covered: '',
    mock_attempted: false,
    mock_score: '',
    note: '',
  })
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: checkin } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (checkin) {
        setTodayCheckin(checkin)
        setForm({
          mood: checkin.mood || '',
          study_hours_logged: checkin.study_hours_logged || '',
          topics_covered: checkin.topics_covered?.join(', ') || '',
          mock_attempted: checkin.mock_attempted || false,
          mock_score: checkin.mock_score || '',
          note: checkin.note || '',
        })
      }

      const { data: statsData } = await supabase
        .from('study_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setStats(statsData)

      const { data: recent } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(7)

      setRecentCheckins(recent || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleCheckin() {
    setSaving(true)
    setError('')
    const supabase = createClient()

    const topics = form.topics_covered
      ? form.topics_covered.split(',').map(t => t.trim()).filter(Boolean)
      : []

    const checkinData = {
      user_id: user.id,
      date: today,
      checked_in: true,
      mood: form.mood,
      study_hours_logged: parseFloat(form.study_hours_logged) || 0,
      topics_covered: topics,
      mock_attempted: form.mock_attempted,
      mock_score: form.mock_attempted ? parseInt(form.mock_score) || null : null,
      note: form.note,
      updated_at: new Date().toISOString(),
    }

    const { error: checkinError } = await supabase
      .from('daily_checkins')
      .upsert(checkinData)

    if (checkinError) { setError('Failed to save check-in.'); setSaving(false); return }

    // Award XP
    const xpEarned = calculateXPForCheckin(
      hoursToday,
      form.mock_attempted,
      parseInt(form.mock_score) || 0,
      newStreak
    )

    const newXP = (stats?.xp || 0) + xpEarned

    // Check milestones
    const newStatsForMilestone = {
      total_hours: newTotal,
      current_streak: newStreak,
      total_days_studied: newDays,
    }
    const earnedMilestoneKeys = checkMilestones(newStatsForMilestone, stats)

    // Save milestones
    for (const key of earnedMilestoneKeys) {
      const milestone = MILESTONES.find(m => m.key === key)
      if (milestone) {
        await supabase.from('milestones').upsert({
          user_id: user.id,
          milestone_key: key,
          milestone_title: milestone.title,
          milestone_desc: milestone.desc,
        })
      }
    }

    const hoursToday = parseFloat(form.study_hours_logged) || 0
    const lastDate = stats?.last_checkin_date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreak = 1
    if (lastDate === today) {
      newStreak = stats?.current_streak || 1
    } else if (lastDate === yesterdayStr) {
      newStreak = (stats?.current_streak || 0) + 1
    }

    const newLongest = Math.max(newStreak, stats?.longest_streak || 0)
    const newTotal = (stats?.total_hours || 0) + (lastDate === today ? hoursToday - (todayCheckin?.study_hours_logged || 0) : hoursToday)
    const newDays = lastDate === today ? (stats?.total_days_studied || 0) : (stats?.total_days_studied || 0) + 1

    await supabase.from('study_stats').upsert({
      user_id: user.id,
      total_hours: Math.max(0, newTotal),
      current_streak: newStreak,
      longest_streak: newLongest,
      total_days_studied: newDays,
      last_checkin_date: today,
      updated_at: new Date().toISOString(),
    })

    const { data: updated } = await supabase
      .from('study_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setStats(updated)
    setTodayCheckin({ ...checkinData })

    const { data: recent } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7)

    setRecentCheckins(recent || [])
    setSaving(false)
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Loading your check-in...</p>
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen px-6 py-12 md:px-16">
      <div className="max-w-2xl mx-auto">

        <div className="mb-10">
          <a href="/dashboard">
            <span className="text-saffron font-bold text-xl">JOIN</span>
            <span className="text-white font-bold text-xl"> SARKAR</span>
          </a>
          <h1 className="text-white text-2xl font-bold mt-6 mb-1">Daily check-in</h1>
          <p className="text-white/50 text-sm">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{stats?.current_streak || 0}</div>
            <div className="text-white/40 text-xs mt-1">Day streak</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{stats?.total_hours?.toFixed(1) || 0}</div>
            <div className="text-white/40 text-xs mt-1">Total hours</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{stats?.total_days_studied || 0}</div>
            <div className="text-white/40 text-xs mt-1">Days studied</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{stats?.longest_streak || 0}</div>
            <div className="text-white/40 text-xs mt-1">Best streak</div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-6">
            {todayCheckin?.checked_in ? 'Update today' : 'Log today'}
          </h2>

          <div className="mb-5">
            <label className="text-white/70 text-sm block mb-3">How are you feeling?</label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <button
                  key={m.label}
                  onClick={() => setForm(p => ({ ...p, mood: m.label }))}
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                    form.mood === m.label
                      ? 'bg-saffron/20 border-saffron text-white'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-white/70 text-sm block mb-2">Hours studied today</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="16"
              value={form.study_hours_logged}
              onChange={e => setForm(p => ({ ...p, study_hours_logged: e.target.value }))}
              placeholder="e.g. 3.5"
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
            />
          </div>

          <div className="mb-5">
            <label className="text-white/70 text-sm block mb-2">Topics covered (comma separated)</label>
            <input
              type="text"
              value={form.topics_covered}
              onChange={e => setForm(p => ({ ...p, topics_covered: e.target.value }))}
              placeholder="e.g. Quantitative Aptitude, Reasoning"
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
            />
          </div>

          <div className="mb-5">
            <label className="text-white/70 text-sm block mb-3">Did you attempt a mock test today?</label>
            <div className="flex gap-3">
              <button
                onClick={() => setForm(p => ({ ...p, mock_attempted: true }))}
                className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                  form.mock_attempted
                    ? 'bg-teal/20 border-teal text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setForm(p => ({ ...p, mock_attempted: false, mock_score: '' }))}
                className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                  !form.mock_attempted
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {form.mock_attempted && (
            <div className="mb-5">
              <label className="text-white/70 text-sm block mb-2">Mock score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.mock_score}
                onChange={e => setForm(p => ({ ...p, mock_score: e.target.value }))}
                placeholder="e.g. 72"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
              />
            </div>
          )}

          <div className="mb-6">
            <label className="text-white/70 text-sm block mb-2">Note to yourself (optional)</label>
            <textarea
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="What went well? What was hard? What will you do tomorrow?"
              rows={3}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleCheckin}
            disabled={saving}
            className="w-full bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : todayCheckin?.checked_in ? 'Update check-in' : 'Submit check-in'}
          </button>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-4">Last 7 days</h2>
          <div className="space-y-2">
            {recentCheckins.length === 0 ? (
              <p className="text-white/30 text-sm">No check-ins yet. Start today.</p>
            ) : (
              recentCheckins.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${c.checked_in ? 'bg-teal' : 'bg-white/20'}`} />
                    <span className="text-white/70 text-sm">
                      {new Date(c.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.mood && <span className="text-white/40 text-xs">{MOODS.find(m => m.label === c.mood)?.emoji}</span>}
                    <span className="text-white/60 text-sm">{c.study_hours_logged}h</span>
                    {c.mock_attempted && <span className="text-teal text-xs">{c.mock_score}%</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
