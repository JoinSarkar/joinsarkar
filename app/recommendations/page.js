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
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colours[level] || 'bg-white/10 border-white/10 text-white/50'}`}>
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
  const [profile, setProfile] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadAndRecommend() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData || !profileData.onboarding_complete) {
        router.push('/onboarding')
        return
      }

      setProfile(profileData)

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

      try {
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: profileData, userId: user.id }),
        })
        const data = await response.json()
        if (data.error) { setError(data.error); setLoading(false); return }
        if (!Array.isArray(data.recommendations)) { setError('Unexpected response. Please try again.'); setLoading(false); return }
        setRecommendations(data.recommendations)
      } catch (e) {
        setError('Failed to connect to AI. Please try again.')
      }
      setLoading(false)
    }
    loadAndRecommend()
  }, [])

  async function saveRecommendations() {
    if (saving) return
    setSaving(true)
    const supabase = createClient()
    const rows = recommendations.map(r => ({
      exam_name: r.exam_name,
      exam_cluster: r.exam_cluster,
      fit_score: r.fit_score,
      time_to_result: r.time_to_result,
      competition_level: r.competition_level,
      salary_range: r.salary_range,
      career_outcome: r.career_outcome,
      why_this_exam: r.why_this_exam,
      syllabus_overlap_percent: r.syllabus_overlap_percent,
      overlap_subjects: r.overlap_subjects,
      is_dream_path: r.is_dream_path,
      bridge_xp_required: r.bridge_xp_required,
      user_id: user.id,
      is_active: true,
    }))
    const { error } = await supabase.from('exam_recommendations').insert(rows)
    if (error) { setError('Failed to save. Please try again.') } else { setSaved(true) }
    setSaving(false)
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Analysing your profile...</p>
        <p className="text-white/30 text-xs">Calculating syllabus overlap and fit scores</p>
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
          <div className="mt-6">
            <h1 className="text-white text-2xl font-bold mb-1">Your exam portfolio</h1>
            <p className="text-white/50 text-sm">Recommended based on your profile — maximum syllabus overlap, minimum distraction</p>
          </div>
        </div>

        {profile?.upsc_optional_subject && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="text-white/40 text-xs font-bold tracking-widest mb-2">OPTIONAL SUBJECT OVERLAP ANALYSIS</div>
            <p className="text-white/70 text-sm">Recommendations optimised for <span className="text-saffron font-medium">{profile.upsc_optional_subject}</span> optional — backups selected for maximum GS and subject overlap.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {recommendations.length === 0 && !error && (
          <div className="text-center py-20">
            <p className="text-white/40 text-sm">No recommendations generated yet.</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {recommendations.map((exam, index) => (
            <div key={exam.exam_name} className={`bg-white/5 border rounded-2xl p-6 ${exam.is_dream_path ? 'border-saffron/30' : 'border-white/10'}`}>
              <div className="flex items-start gap-4 mb-4">
                <ScoreRing score={exam.fit_score} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-white font-bold text-lg">{exam.exam_name}</h2>
                    {index === 0 && <span className="text-xs bg-saffron/20 text-saffron border border-saffron/30 px-2 py-0.5 rounded-full">Best fit</span>}
                    {exam.is_dream_path && <span className="text-xs bg-saffron/10 text-saffron border border-saffron/20 px-2 py-0.5 rounded-full">Dream path</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white/40 text-xs">{exam.exam_cluster} cluster</span>
                    <CompetitionBadge level={exam.competition_level} />
                    {exam.syllabus_overlap_percent && (
                      <span className="text-xs text-teal">{exam.syllabus_overlap_percent}% syllabus overlap</span>
                    )}
                  </div>
                </div>
              </div>

              {exam.overlap_subjects && exam.overlap_subjects.length > 0 && (
                <div className="bg-teal/5 border border-teal/10 rounded-xl p-3 mb-4">
                  <div className="text-teal text-xs mb-1">Shared topics with your primary exam</div>
                  <div className="flex flex-wrap gap-1">
                    {exam.overlap_subjects.map(s => (
                      <span key={s} className="text-xs bg-teal/10 text-teal/80 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

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

        {profile?.dream_job && (
          <div className="bg-saffron/5 border border-saffron/20 rounded-2xl p-5 mb-8">
            <div className="text-saffron text-xs font-bold tracking-widest mb-2">YOUR DREAM PATH</div>
            <p className="text-white font-semibold text-sm mb-1">{profile.dream_job}</p>
            <p className="text-white/50 text-xs">Start with your recommended exams. As you build XP and experience, the bridge to your dream job becomes clearer. The War Room shows your progress toward it.</p>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
          <p className="text-white/50 text-xs leading-relaxed">
            <span className="text-white font-semibold">Three Exam Rule:</span> You are committed to exactly these 3 exams. Spreading across more dilutes preparation. These were chosen for maximum compatibility and syllabus overlap. To change exams, update your profile.
          </p>
        </div>

        <div className="flex gap-3">
          {!saved ? (
            <button
              onClick={saveRecommendations}
              disabled={saving}
              className="flex-1 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Commit to these exams'}
            </button>
          ) : (
            <a href="/studyplan" className="flex-1 bg-teal text-white font-semibold py-3 rounded-xl hover:bg-teal/90 transition-colors text-center">
              Generate your study plan
            </a>
          )}
        </div>

      </div>
    </main>
  )
}
