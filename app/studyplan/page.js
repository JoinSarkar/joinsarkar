'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

function QuizModal({ subject, exams, onClose }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadQuiz() {
      try {
        const response = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, examContext: exams?.join(', ') }),
        })
        const data = await response.json()
        if (data.error) { setError(data.error); setLoading(false); return }
        setQuestions(data.questions)
        setLoading(false)
      } catch (e) {
        setError('Failed to load quiz. Please try again.')
        setLoading(false)
      }
    }
    loadQuiz()
  }, [])

  function handleAnswer(option) {
    if (selected) return
    setSelected(option)
    setAnswers(prev => [...prev, { question: current, selected: option, correct: questions[current].correct }])
  }

  function handleNext() {
    if (current < questions.length - 1) {
      setCurrent(prev => prev + 1)
      setSelected(null)
    } else {
      setShowResult(true)
    }
  }

  const score = answers.filter(a => a.selected === a.correct).length

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-ink border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-lg">Quiz — {subject}</h2>
              {!showResult && !loading && (
                <p className="text-white/40 text-xs mt-0.5">Question {current + 1} of {questions.length}</p>
              )}
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white text-xl transition-colors">x</button>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Generating quiz...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && !showResult && questions[current] && (
            <div>
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-white text-sm leading-relaxed">{questions[current].question}</p>
              </div>
              <div className="space-y-3 mb-6">
                {Object.entries(questions[current].options).map(([key, value]) => {
                  let style = 'bg-white/5 border-white/10 text-white/70'
                  if (selected) {
                    if (key === questions[current].correct) style = 'bg-teal/20 border-teal text-white'
                    else if (key === selected && selected !== questions[current].correct) style = 'bg-red-500/20 border-red-500 text-white'
                    else style = 'bg-white/5 border-white/10 text-white/30'
                  }
                  return (
                    <button
                      key={key}
                      onClick={() => handleAnswer(key)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${style}`}
                    >
                      <span className="font-bold mr-2">{key}.</span>{value}
                    </button>
                  )
                })}
              </div>
              {selected && (
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <p className="text-white/40 text-xs mb-1">Explanation</p>
                  <p className="text-white/70 text-sm leading-relaxed">{questions[current].explanation}</p>
                </div>
              )}
              {selected && (
                <button
                  onClick={handleNext}
                  className="w-full bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors"
                >
                  {current < questions.length - 1 ? 'Next question' : 'See results'}
                </button>
              )}
            </div>
          )}

          {showResult && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full border-4 border-saffron flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">{score}/{questions.length}</span>
              </div>
              <p className="text-white font-bold text-xl mb-2">
                {score === questions.length ? 'Perfect score!' : score >= questions.length * 0.7 ? 'Well done!' : score >= questions.length * 0.4 ? 'Keep practising' : 'Needs more work'}
              </p>
              <p className="text-white/50 text-sm mb-8">
                You got {score} out of {questions.length} questions correct on {subject}
              </p>
              <div className="space-y-2 text-left mb-8">
                {answers.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2">
                    <span className={a.selected === a.correct ? 'text-teal' : 'text-red-400'}>
                      {a.selected === a.correct ? 'correct' : 'wrong'}
                    </span>
                    <span className="text-white/50 text-sm">Q{i + 1} — You chose {a.selected}, answer was {a.correct}</span>
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="w-full bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors">
                Back to study plan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NotesModal({ subject, exams, onClose }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadNotes() {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, examContext: exams?.join(', ') }),
        })
        const data = await response.json()
        if (data.error) { setError(data.error); setLoading(false); return }
        setNotes(data.notes)
        setLoading(false)
      } catch (e) {
        setError('Failed to load notes. Please try again.')
        setLoading(false)
      }
    }
    loadNotes()
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-ink border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-lg">Notes — {subject}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white text-xl transition-colors">x</button>
          </div>
          {loading && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Generating notes...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {!loading && !error && (
            <div className="prose prose-invert max-w-none">
              <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{notes}</div>
            </div>
          )}
          {!loading && !error && (
            <button onClick={onClose} className="w-full mt-6 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StudyPlanPage() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeDay, setActiveDay] = useState('Monday')
  const [user, setUser] = useState(null)
  const [quizSubject, setQuizSubject] = useState(null)
  const [notesSubject, setNotesSubject] = useState(null)
  const router = useRouter()

  async function fetchAndGeneratePlan(currentUser, forceRegenerate = false) {
    const supabase = createClient()
    if (!forceRegenerate) {
      const { data: existing } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', currentUser.id)
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
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('study_hours_per_day')
      .eq('id', currentUser.id)
      .single()
    if (profileError || !profile) { router.push('/onboarding'); return }
    const { data: exams } = await supabase
      .from('exam_recommendations')
      .select('exam_name')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
    if (!exams || exams.length === 0) { router.push('/recommendations'); return }
    const examNames = exams.map(e => e.exam_name)
    const hoursPerDay = profile?.study_hours_per_day || 4
    try {
      const response = await fetch('/api/studyplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exams: examNames, hoursPerDay }),
      })
      const data = await response.json()
      if (data.error) { setError('Failed to generate plan. Please try again.'); setLoading(false); return }
      setPlan(data.plan)
      setSaved(false)
    } catch (e) {
      setError('Failed to connect to AI. Please try again.')
    }
    setLoading(false)
  }

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      await fetchAndGeneratePlan(user, false)
    }
    init()
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
    setError('')
    const supabase = createClient()
    await supabase.from('study_plans').update({ is_active: false }).eq('user_id', user.id)
    await fetchAndGeneratePlan(user, true)
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
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white/50 text-sm mb-4">Could not load your plan.</p>
        <button onClick={() => { setLoading(true); fetchAndGeneratePlan(user, true) }} className="bg-saffron text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-saffron/90 transition-colors">
          Try again
        </button>
      </main>
    )
  }

  const todayPlan = plan.weekly_plan?.find(d => d.day === activeDay)

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen px-6 py-12 md:px-16">
      {quizSubject && (
        <QuizModal
          subject={quizSubject}
          exams={plan.exams}
          onClose={() => setQuizSubject(null)}
        />
      )}
      {notesSubject && (
        <NotesModal
          subject={notesSubject}
          exams={plan.exams}
          onClose={() => setNotesSubject(null)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <a href="/dashboard">
            <span className="text-saffron font-bold text-xl">JOIN</span>
            <span className="text-white font-bold text-xl"> SARKAR</span>
          </a>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold mb-1">Your study plan</h1>
              <p className="text-white/50 text-sm">{plan.hours_per_day} hours/day across {plan.exams?.join(', ')}</p>
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
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeDay === d.day ? 'bg-saffron text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
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
                    <p className="text-white/60 text-sm mb-4">{s.activity}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setQuizSubject(s.subject)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-saffron/10 border border-saffron/20 text-saffron hover:bg-saffron/20 transition-colors"
                      >
                        Quiz me
                      </button>
                      <button
                        onClick={() => setNotesSubject(s.subject)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors"
                      >
                        Give me notes
                      </button>
                    </div>
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
            <button onClick={savePlan} disabled={saving} className="flex-1 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50">
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
