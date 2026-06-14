'use client'

import Link from 'next/link'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function WeeklyReviewPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [review, setReview] = useState(null)
  const [weekStats, setWeekStats] = useState(null)
  const [error, setError] = useState('')
  const [pastReviews, setPastReviews] = useState([])
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekStartStr = weekStart.toISOString().split('T')[0]

      const { data: existingReview } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .single()

      const { data: past } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(5)

      setPastReviews(past || [])

      if (existingReview) {
        setReview(JSON.parse(existingReview.review_text))
        setWeekStats({
          totalHours: existingReview.hours_studied,
          targetHours: existingReview.hours_target,
          daysStudied: existingReview.days_studied,
          consistencyScore: existingReview.consistency_score,
          mockScores: existingReview.mock_scores || [],
        })
        setLoading(false)
        return
      }

      setLoading(false)
    }
    load()
  }, [])

  async function generateReview() {
    if (generating) return
    setGenerating(true)
    setError('')
    const supabase = createClient()

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const [profileRes, statsRes, checkinsRes, examsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('study_stats').select('*').eq('user_id', user.id).single(),
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).gte('date', weekStartStr).lte('date', weekEndStr),
      supabase.from('exam_recommendations').select('exam_name').eq('user_id', user.id).eq('is_active', true),
    ])

    try {
      const response = await fetch('/api/weeklyreview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profileRes.data,
          stats: statsRes.data,
          checkins: checkinsRes.data || [],
          exams: examsRes.data || [],
        }),
      })

      const data = await response.json()
      if (data.error) { setError(data.error); setGenerating(false); return }

      setReview(data.review)
      setWeekStats(data.stats)

      await supabase.from('weekly_reviews').upsert({
        user_id: user.id,
        week_start: weekStartStr,
        week_end: weekEndStr,
        hours_studied: data.stats.totalHours,
        hours_target: data.stats.targetHours,
        days_studied: data.stats.daysStudied,
        consistency_score: data.stats.consistencyScore,
        mock_scores: data.stats.mockScores,
        review_text: JSON.stringify(data.review),
      })

      const { data: past } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(5)
      setPastReviews(past || [])

    } catch (e) {
      setError('Failed to generate review. Please try again.')
    }
    setGenerating(false)
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen px-6 py-12 md:px-16">
      <div className="max-w-2xl mx-auto">

        <div className="mb-10">
          <Link href="/dashboard">
            <span className="text-saffron font-bold text-xl">JOIN</span>
            <span className="text-white font-bold text-xl"> SARKAR</span>
          </Link>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <div className="text-saffron text-xs font-bold tracking-widest mb-1">WEEKLY REVIEW</div>
              <h1 className="text-white text-2xl font-bold mb-1">This week's performance</h1>
              <p className="text-white/50 text-sm">
                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} — Week {Math.ceil(new Date().getDate() / 7)}
              </p>
            </div>
            <button type="button"
              onClick={generateReview}
              disabled={generating}
              className="shrink-0 bg-saffron text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : review ? 'Regenerate' : 'Generate review'}
            </button>
          </div>
        </div>

        {generating && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-saffron border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-white/50 text-sm">Analysing your week and generating review...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!review && !generating && (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-white/40 text-sm mb-2">No review generated yet this week.</p>
            <p className="text-white/30 text-xs mb-6">Click Generate review to get your personalised weekly analysis.</p>
            <button type="button" onClick={generateReview} className="bg-saffron text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-saffron/90 transition-colors">
              Generate this week's review
            </button>
          </div>
        )}

        {review && weekStats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-saffron text-2xl font-bold">{weekStats.totalHours}h</div>
                <div className="text-white/40 text-xs mt-1">of {weekStats.targetHours}h target</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-saffron text-2xl font-bold">{weekStats.daysStudied}/7</div>
                <div className="text-white/40 text-xs mt-1">days studied</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-saffron text-2xl font-bold">{weekStats.consistencyScore}%</div>
                <div className="text-white/40 text-xs mt-1">consistency</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-saffron text-2xl font-bold">{weekStats.avgMock ? weekStats.avgMock + '%' : 'N/A'}</div>
                <div className="text-white/40 text-xs mt-1">avg mock score</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-white/40 text-xs font-bold tracking-widest mb-3">OVERALL ASSESSMENT</div>
              <p className="text-white/80 text-sm leading-relaxed">{review.overall}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-teal/5 border border-teal/20 rounded-2xl p-5">
                <div className="text-teal text-xs font-bold tracking-widest mb-2">TOP STRENGTH</div>
                <p className="text-white/70 text-sm leading-relaxed">{review.strength}</p>
              </div>
              <div className="bg-saffron/5 border border-saffron/20 rounded-2xl p-5">
                <div className="text-saffron text-xs font-bold tracking-widest mb-2">IMPROVE THIS</div>
                <p className="text-white/70 text-sm leading-relaxed">{review.improvement}</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-white/40 text-xs font-bold tracking-widest mb-3">NEXT WEEK FOCUS</div>
              <div className="space-y-2">
                {review.next_week?.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-saffron font-bold text-sm shrink-0">{i + 1}.</span>
                    <p className="text-white/70 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-ink border border-saffron/20 rounded-2xl p-5 text-center">
              <p className="text-saffron font-semibold text-sm">{review.motivation}</p>
            </div>
          </div>
        )}

        {pastReviews.length > 1 && (
          <div className="mt-10">
            <h2 className="text-white font-semibold mb-4">Past reviews</h2>
            <div className="space-y-2">
              {pastReviews.slice(1).map(r => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">
                      Week of {new Date(r.week_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-white/40 text-xs">{r.hours_studied}h studied — {r.consistency_score}% consistent</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg border ${r.consistency_score >= 70 ? 'bg-teal/10 border-teal/20 text-teal' : r.consistency_score >= 40 ? 'bg-saffron/10 border-saffron/20 text-saffron' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    {r.consistency_score >= 70 ? 'Strong' : r.consistency_score >= 40 ? 'Moderate' : 'Needs work'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
