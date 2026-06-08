'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

function ScoreRing({ score }) {
  const color = score >= 80 ? '#1D9E75' : score >= 65 ? '#D85A30' : '#7C7B78'
  return (
    <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 shrink-0" style={{ borderColor: color }}>
      <span className="text-white font-bold text-lg">{score}</span>
    </div>
  )
}

function CompetitionBadge({ level }) {
  const colours = {
    'Very High': 'bg-red-500/10 text-red-400 border-red-500/20',
    'High': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Medium-High': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Medium': 'bg-teal/10 text-teal border-teal/20',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colours[level] || 'bg-white/10 text-white/50 border-white/10'}`}>
      {level} competition
    </span>
  )
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadAndRecommend() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: existing } = await supabase
        .from('exam_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (existing && existing.length > 0) {
        setRecommendations(existing)
        setSaved(true)
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) { router.push('/onboarding'); return }

      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      })

      const data = await response.json()
      if (data.error) { setError('Failed to generate recommendations.'); setLoading(false); return }
      setRecommendations(data.recommendations)
      setLoading(false)
    }
    loadAndRecommend()
  }, [])

  async function saveRecommendations() {
    setSaving(true)
    const supabase = createClient()
    const rows = recommendations.map((r) => ({ ...r, user_id: user.id }))
    const { error } = await supabase.from('exam_recommendations').insert(rows)
    if (error) { setError('Failed to save. Please try again.') } else { setSaved(true) }
    setSaving(false)
  }

  async function regenerate() {
    setLoading(true)
    setSaved(false)
    setError('')
    const supabase = createClient()
    await supabase.from('exam_recommendations').delete().eq('user_id', user.id)
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    })
    const data = await response.json()
    setRecommendations(data.recommendations)
    setLoading(false)
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Analysing your profile...</p>
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
          <div className="mt-6 flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold mb-1">Your exam shortlist</h1>
              <p className="text-white/50 text-sm">Based on your profile — maximum 3 active exams at a time</p>
            </div>
            <button onClick={regenerate} className="text-white/40 text-xs border border-white/10 px-3 py-2 rounded-lg hover:border-white/30 transition-colors shrink-0">
              Regenerate
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {recommendations.map((exam, index) => (
            <div key={exam.exam_name} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <ScoreRing score={exam.fit_score} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-white font-bold text-lg">{exam.exam_name}</h2>
                    {index === 0 && (
                      <span className="text-xs bg-saffron/20 text-saffron border border-saffron/30 px-2 py-0.5 rounded-full">Best fit</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white/40 text-xs">{exam.exam_cluster} cluster</span>
                    <CompetitionBadge level={exam.competition_level} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-white/40 text-xs mb-1">Time to result</div>
                  <div className="text-white text-sm font-medium">{exam.time_to_result}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-white/40 text-xs mb-1">Salary range</div>
                  <div className="text-white text-sm font-medium">{exam.salary_range}</div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 mb-4">
                <div className="text-white/40 text-xs mb-1">Career outcome</div>
                <div className="text-white text-sm">{exam.career_outcome}</div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="text-white/40 text-xs mb-2">Why this exam for you</div>
                <p className="text-white/70 text-sm leading-relaxed">{exam.why_this_exam}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-saffron/5 border border-saffron/20 rounded-2xl p-4 mb-8">
          <p className="text-saffron/80 text-xs leading-relaxed">
            <span className="font-semibold">The Three Exam Rule:</span> You are limited to 3 active exams at any time. Spreading across more exams dilutes preparation and reduces your chances in all of them.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          {!saved ? (
            <button
              onClick={saveRecommendations}
              disabled={saving}
              className="flex-1 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Confirm these exams'}
            </button>
          ) : (
            <a href="/dashboard" className="flex-1 bg-teal text-white font-semibold py-3 rounded-xl hover:bg-teal/90 transition-colors text-center">
              Exams confirmed - go to dashboard
            </a>
          )}
        </div>

      </div>
    </main>
  )
}
