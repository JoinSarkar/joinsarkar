'use client'

import Link from 'next/link'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

const EXAM_TYPES = [
  'UPSC Mains',
  'UPSC Prelims',
  'State PCS Mains',
  'Judiciary Mains',
  'Essay Paper',
]

const WORD_LIMITS = [
  { label: '150 words', value: 150 },
  { label: '250 words', value: 250 },
  { label: '400 words', value: 400 },
  { label: '500 words', value: 500 },
]

function ScoreBar({ score, max }) {
  const percent = (score / max) * 100
  const color = percent >= 70 ? '#1D9E75' : percent >= 50 ? '#D85A30' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-white/10 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all" style={{ width: percent + '%', backgroundColor: color }} />
      </div>
      <span className="text-white text-xs font-bold shrink-0">{score}/{max}</span>
    </div>
  )
}

export default function AnswerWritingPage() {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [examType, setExamType] = useState('UPSC Mains')
  const [wordLimit, setWordLimit] = useState(250)
  const [evaluating, setEvaluating] = useState(false)
  const [generatingModel, setGeneratingModel] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [modelAnswer, setModelAnswer] = useState('')
  const [showModel, setShowModel] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('write')
  const router = useRouter()

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setSubscription(sub)
      setLoading(false)
    }
    load()
  }, [])

  async function handleEvaluate() {
    if (evaluating) return
    if (!question.trim()) { setError('Please enter a question.'); return }
    if (!answer.trim()) { setError('Please write your answer first.'); return }
    if (answer.trim().split(/\s+/).length < 20) { setError('Answer is too short. Write at least 20 words.'); return }

    setEvaluating(true)
    setError('')
    setEvaluation(null)

    try {
      const response = await fetch('/api/answerwriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, wordLimit, examType, mode: 'evaluate' }),
      })
      const data = await response.json()
      if (data.error) { setError(data.error); setEvaluating(false); return }
      setEvaluation(data.evaluation)
      setActiveTab('result')
    } catch (e) {
      setError('Failed to evaluate. Please try again.')
    }
    setEvaluating(false)
  }

  async function handleModelAnswer() {
    if (generatingModel) return
    if (!question.trim()) { setError('Please enter a question first.'); return }
    setGeneratingModel(true)
    setError('')
    setModelAnswer('')

    try {
      const response = await fetch('/api/answerwriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, wordLimit, examType, mode: 'model_answer' }),
      })
      const data = await response.json()
      if (data.error) { setError(data.error); setGeneratingModel(false); return }
      setModelAnswer(data.modelAnswer)
      setShowModel(true)
    } catch (e) {
      setError('Failed to generate model answer. Please try again.')
    }
    setGeneratingModel(false)
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (subscription?.plan !== 'advanced' || subscription?.status !== 'active') {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-saffron/10 border border-saffron/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-saffron text-2xl">lock</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-3">Advanced Track only</h1>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Answer writing evaluation and model answer generation is available exclusively on the Advanced Track (Rs 499/month) for UPSC, State PCS, and Judiciary aspirants.
          </p>
          <Link href="/pricing" className="bg-saffron text-white font-semibold px-8 py-3 rounded-xl hover:bg-saffron/90 transition-colors">
            Upgrade to Advanced Track
          </Link>
        </div>
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
          <h1 className="text-white text-2xl font-bold mt-6 mb-1">Answer Writing</h1>
          <p className="text-white/50 text-sm">Write your answer and get AI evaluation with model answer</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-white/70 text-sm block mb-2">Exam type</label>
              <select
                value={examType}
                onChange={e => setExamType(e.target.value)}
                className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-saffron transition-colors"
              >
                {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2">Word limit</label>
              <select
                value={wordLimit}
                onChange={e => setWordLimit(parseInt(e.target.value))}
                className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-saffron transition-colors"
              >
                {WORD_LIMITS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-white/70 text-sm block mb-2">Question</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Paste or type the question here..."
              rows={3}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors resize-none"
            />
          </div>

          <div className="flex gap-2 mb-5">
            <button type="button"
              onClick={() => setActiveTab('write')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'write' ? 'bg-saffron text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
              Write answer
            </button>
            {evaluation && (
              <button type="button"
                onClick={() => setActiveTab('result')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'result' ? 'bg-saffron text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
              >
                Evaluation
              </button>
            )}
          </div>

          {activeTab === 'write' && (
            <div>
              <div className="relative mb-2">
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Write your answer here..."
                  rows={12}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors resize-none"
                />
              </div>
              <div className="flex items-center justify-between mb-5">
                <span className={`text-xs ${wordCount > wordLimit * 1.1 ? 'text-red-400' : wordCount >= wordLimit * 0.9 ? 'text-teal' : 'text-white/40'}`}>
                  {wordCount} / {wordLimit} words
                </span>
                {wordCount > wordLimit * 1.1 && (
                  <span className="text-red-400 text-xs">Over word limit</span>
                )}
              </div>

              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button"
                  onClick={handleEvaluate}
                  disabled={evaluating}
                  className="flex-1 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50"
                >
                  {evaluating ? 'Evaluating...' : 'Evaluate my answer'}
                </button>
                <button type="button"
                  onClick={handleModelAnswer}
                  disabled={generatingModel}
                  className="flex-1 bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {generatingModel ? 'Generating...' : 'Model answer'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'result' && evaluation && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-saffron flex items-center justify-center shrink-0">
                  <span className="text-white text-xl font-bold">{evaluation.total_score}</span>
                </div>
                <div>
                  <div className="text-white font-bold text-2xl">{evaluation.grade}</div>
                  <div className="text-white/50 text-sm">{evaluation.total_score} out of {evaluation.max_score}</div>
                </div>
              </div>

              <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 mb-5">
                <p className="text-white/40 text-xs mb-1">Strength</p>
                <p className="text-white/80 text-sm">{evaluation.top_strength}</p>
              </div>

              <div className="bg-saffron/5 border border-saffron/20 rounded-xl p-4 mb-5">
                <p className="text-white/40 text-xs mb-1">Top improvement needed</p>
                <p className="text-white/80 text-sm">{evaluation.top_improvement}</p>
              </div>

              <div className="space-y-4 mb-5">
                {evaluation.parameters?.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/70 text-xs">{p.name}</span>
                    </div>
                    <ScoreBar score={p.score} max={p.max} />
                    <p className="text-white/40 text-xs mt-1">{p.feedback}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-5">
                <p className="text-white/40 text-xs mb-1">Overall feedback</p>
                <p className="text-white/70 text-sm leading-relaxed">{evaluation.overall_feedback}</p>
              </div>

              <button type="button"
                onClick={() => setActiveTab('write')}
                className="w-full bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                Revise answer
              </button>
            </div>
          )}
        </div>

        {showModel && modelAnswer && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Model Answer</h2>
              <button type="button" onClick={() => setShowModel(false)} className="text-white/40 hover:text-white text-xs transition-colors">Hide</button>
            </div>
            <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{modelAnswer}</div>
          </div>
        )}

      </div>
    </main>
  )
}
