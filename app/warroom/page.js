'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { getRankSystem, getCurrentRank, getNextRank, getXPProgress } from '../../lib/gameEngine'

function XPBar({ xp, rankSystem }) {
  const current = getCurrentRank(xp, rankSystem)
  const next = getNextRank(xp, rankSystem)
  const progress = getXPProgress(xp, rankSystem)
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-saffron text-xs font-bold tracking-widest mb-0.5">CURRENT RANK</div>
          <div className="text-white font-bold text-xl">{current.title}</div>
        </div>
        <div className="text-right">
          <div className="text-white/40 text-xs mb-0.5">Total XP</div>
          <div className="text-white font-bold text-xl">{xp}</div>
        </div>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 mb-2">
        <div
          className="h-2 rounded-full bg-saffron transition-all"
          style={{ width: progress + '%' }}
        />
      </div>
      {next ? (
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs">{current.title}</span>
          <span className="text-saffron text-xs">{next.xp - xp} XP to {next.title}</span>
        </div>
      ) : (
        <div className="text-teal text-xs text-center">Maximum rank achieved</div>
      )}
    </div>
  )
}

function HeatMap({ checkins }) {
  const days = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const checkin = checkins.find(c => c.date === dateStr)
    days.push({ date: dateStr, hours: checkin?.study_hours_logged || 0, checked: checkin?.checked_in || false })
  }

  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="text-white/40 text-xs font-medium tracking-widest mb-4">90-DAY CONSISTENCY</div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => {
              let color = 'bg-white/5'
              if (day.checked && day.hours >= 6) color = 'bg-teal'
              else if (day.checked && day.hours >= 3) color = 'bg-saffron'
              else if (day.checked) color = 'bg-saffron/40'
              return (
                <div
                  key={di}
                  title={day.date + ': ' + day.hours + 'h'}
                  className={`w-3 h-3 rounded-sm ${color} transition-colors`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-white/5" /><span className="text-white/30 text-xs">None</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-saffron/40" /><span className="text-white/30 text-xs">Light</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-saffron" /><span className="text-white/30 text-xs">Good</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-teal" /><span className="text-white/30 text-xs">Strong</span></div>
      </div>
    </div>
  )
}

function MilestoneCard({ milestone, achieved }) {
  return (
    <div className={`rounded-2xl p-4 border flex items-center gap-3 ${achieved ? 'bg-teal/10 border-teal/20' : 'bg-white/5 border-white/10 opacity-40'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${achieved ? 'bg-teal/20' : 'bg-white/10'}`}>
        <span className="text-lg">{achieved ? 'star' : 'lock'}</span>
      </div>
      <div>
        <div className={`font-semibold text-sm ${achieved ? 'text-white' : 'text-white/50'}`}>{milestone.title}</div>
        <div className="text-white/40 text-xs">{milestone.desc}</div>
        <div className={`text-xs mt-0.5 ${achieved ? 'text-teal' : 'text-white/30'}`}>+{milestone.xp} XP</div>
      </div>
    </div>
  )
}

export default function WarRoomPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [exams, setExams] = useState([])
  const [checkins, setCheckins] = useState([])
  const [milestones, setMilestones] = useState([])
  const [subjectMastery, setSubjectMastery] = useState([])
  const [loading, setLoading] = useState(true)
  const [briefing, setBriefing] = useState(null)
  const [loadingBriefing, setLoadingBriefing] = useState(false)
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const [profileRes, statsRes, examsRes, checkinsRes, milestonesRes, masteryRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('study_stats').select('*').eq('user_id', user.id).single(),
        supabase.from('exam_recommendations').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(90),
        supabase.from('milestones').select('milestone_key').eq('user_id', user.id),
        supabase.from('subject_mastery').select('*').eq('user_id', user.id).order('mastery_score', { ascending: false }),
      ])

      setProfile(profileRes.data)
      setStats(statsRes.data)
      setExams(examsRes.data || [])
      setCheckins(checkinsRes.data || [])
      setMilestones(milestonesRes.data?.map(m => m.milestone_key) || [])
      setSubjectMastery(masteryRes.data || [])
      setLoading(false)

      generateBriefing(profileRes.data, statsRes.data, examsRes.data || [], checkinsRes.data || [])
    }
    load()
  }, [])

  async function generateBriefing(profile, stats, exams, checkins) {
    setLoadingBriefing(true)
    try {
      const response = await fetch('/api/warroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, stats, exams, recentCheckins: checkins.slice(0, 7) }),
      })
      const data = await response.json()
      if (!data.error) setBriefing(data.briefing)
    } catch (e) {
      console.error('Briefing error:', e)
    }
    setLoadingBriefing(false)
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Loading your War Room...</p>
      </main>
    )
  }

  const rankSystem = getRankSystem(profile?.career_aspiration)
  const xp = stats?.xp || 0
  const currentRank = getCurrentRank(xp, rankSystem)

  const MILESTONES_LIST = [
    { key: 'first_checkin', title: 'First Step', desc: 'First daily check-in', xp: 20 },
    { key: 'streak_3', title: '3-Day Streak', desc: '3 days in a row', xp: 30 },
    { key: 'streak_7', title: 'Week Warrior', desc: '7 days in a row', xp: 50 },
    { key: 'streak_30', title: 'Iron Discipline', desc: '30 days in a row', xp: 150 },
    { key: 'hours_10', title: 'Getting Started', desc: '10 hours logged', xp: 25 },
    { key: 'hours_50', title: 'Serious Aspirant', desc: '50 hours logged', xp: 75 },
    { key: 'hours_100', title: 'Century', desc: '100 hours logged', xp: 200 },
    { key: 'hours_500', title: 'Elite Aspirant', desc: '500 hours logged', xp: 500 },
    { key: 'first_mock', title: 'Mock Master', desc: 'First mock attempted', xp: 25 },
    { key: 'mock_70', title: 'Above Average', desc: 'Scored above 70% in mock', xp: 40 },
  ]

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen px-6 py-12 md:px-16">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10">
          <a href="/dashboard">
            <span className="text-saffron font-bold text-xl">JOIN</span>
            <span className="text-white font-bold text-xl"> SARKAR</span>
          </a>
          <div className="mt-6 flex items-start justify-between">
            <div>
              <div className="text-saffron text-xs font-bold tracking-widest mb-1">WAR ROOM</div>
              <h1 className="text-white text-2xl font-bold mb-1">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h1>
              <p className="text-white/50 text-sm">{rankSystem.name} track — {currentRank.title}</p>
            </div>
            <a href="/checkin" className="shrink-0 bg-saffron text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-saffron/90 transition-colors">
              Check in
            </a>
          </div>
        </div>

        {loadingBriefing && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-saffron border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-white/50 text-sm">Generating your daily briefing...</p>
          </div>
        )}

        {briefing && !loadingBriefing && (
          <div className="bg-saffron/5 border border-saffron/20 rounded-2xl p-5 mb-6">
            <div className="text-saffron text-xs font-bold tracking-widest mb-3">TODAY'S BRIEFING</div>
            <p className="text-white font-semibold text-sm mb-2">{briefing.headline}</p>
            <p className="text-white/60 text-sm leading-relaxed mb-3">{briefing.insight}</p>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/40 text-xs mb-1">Today's mission</p>
              <p className="text-white/80 text-sm">{briefing.mission}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{stats?.current_streak || 0}</div>
            <div className="text-white/40 text-xs mt-1">Day streak</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{stats?.total_hours?.toFixed(0) || 0}</div>
            <div className="text-white/40 text-xs mt-1">Hours logged</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{xp}</div>
            <div className="text-white/40 text-xs mt-1">Total XP</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-saffron text-2xl font-bold">{stats?.freeze_tokens || 0}</div>
            <div className="text-white/40 text-xs mt-1">Freeze tokens</div>
          </div>
        </div>

        <div className="mb-6">
          <XPBar xp={xp} rankSystem={rankSystem} />
        </div>

        <div className="mb-6">
          <HeatMap checkins={checkins} />
        </div>

        {subjectMastery.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <div className="text-white/40 text-xs font-medium tracking-widest mb-4">SUBJECT MASTERY</div>
            <div className="space-y-3">
              {subjectMastery.slice(0, 6).map(s => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-sm">{s.subject}</span>
                    <span className="text-white/40 text-xs">{s.mastery_score}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: s.mastery_score + '%',
                        backgroundColor: s.mastery_score >= 70 ? '#1D9E75' : s.mastery_score >= 40 ? '#D85A30' : '#7C7B78'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-white font-semibold mb-4">Milestones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MILESTONES_LIST.map(m => (
              <MilestoneCard key={m.key} milestone={m} achieved={milestones.includes(m.key)} />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <a href="/checkin" className="flex-1 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors text-center">
            Log today's study
          </a>
          <a href="/studyplan" className="flex-1 bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-colors text-center">
            View study plan
          </a>
        </div>

      </div>
    </main>
  )
}
