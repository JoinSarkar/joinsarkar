'use client'

import Link from 'next/link'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

const CATEGORY_COLORS = {
  Government: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  Economy: 'bg-green-500/10 border-green-500/20 text-green-400',
  International: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  Science: 'bg-teal/10 border-teal/20 text-teal',
  Sports: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  Awards: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  Legal: 'bg-red-500/10 border-red-500/20 text-red-400',
  Defence: 'bg-saffron/10 border-saffron/20 text-saffron',
}

function MCQCard({ mcq }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className="mt-4 bg-white/5 rounded-xl p-4">
      <p className="text-white/70 text-xs font-semibold mb-3">Quick MCQ</p>
      <p className="text-white text-sm mb-3">{mcq.question}</p>
      <div className="space-y-2">
        {Object.entries(mcq.options).map(([key, value]) => {
          let style = 'bg-white/5 border-white/10 text-white/60'
          if (selected) {
            if (key === mcq.correct) style = 'bg-teal/20 border-teal text-white'
            else if (key === selected) style = 'bg-red-500/20 border-red-500 text-white/60'
            else style = 'bg-white/5 border-white/10 text-white/30'
          }
          return (
            <button type="button"
              key={key}
              onClick={() => !selected && setSelected(key)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${style}`}
            >
              <span className="font-bold mr-2">{key}.</span>{value}
            </button>
          )
        })}
      </div>
      {selected && (
        <div className="mt-3 bg-white/5 rounded-lg p-3">
          <p className="text-white/40 text-xs mb-1">{selected === mcq.correct ? 'Correct!' : 'Wrong — Answer is ' + mcq.correct}</p>
          <p className="text-white/60 text-xs">{mcq.explanation}</p>
        </div>
      )}
    </div>
  )
}

export default function CurrentAffairsPage() {
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [expandedItem, setExpandedItem] = useState(null)
  const [filter, setFilter] = useState('All')
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]
  const categories = ['All', 'Government', 'Economy', 'International', 'Science', 'Sports', 'Awards', 'Legal', 'Defence']

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: existing } = await supabase
        .from('current_affairs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (existing) {
        setItems(existing.items)
        setLoading(false)
        return
      }

      await generateCurrentAffairs(user)
    }
    load()
  }, [])

  async function generateCurrentAffairs(currentUser) {
    setGenerating(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: exams } = await supabase
        .from('exam_recommendations')
        .select('exam_name')
        .eq('user_id', currentUser.id)
        .eq('is_active', true)

      const examContext = exams?.map(e => e.exam_name).join(', ') || 'SSC, Banking'

      const response = await fetch('/api/currentaffairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examContext }),
      })

      const data = await response.json()
      if (data.error) { setError(data.error); setGenerating(false); setLoading(false); return }

      await supabase.from('current_affairs').upsert({
        user_id: currentUser.id,
        date: today,
        items: data.items,
      })

      setItems(data.items)
    } catch (e) {
      setError('Failed to load current affairs. Please try again.')
    }
    setGenerating(false)
    setLoading(false)
  }

  const filtered = filter === 'All' ? items : items.filter(i => i.category === filter)

  if (loading || generating) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">{generating ? 'Fetching today\'s current affairs...' : 'Loading...'}</p>
        <p className="text-white/30 text-xs">This takes about 15 seconds</p>
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
              <h1 className="text-white text-2xl font-bold mb-1">Current Affairs</h1>
              <p className="text-white/50 text-sm">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button type="button"
              onClick={() => generateCurrentAffairs(user)}
              className="text-white/40 text-xs border border-white/10 px-3 py-2 rounded-lg hover:border-white/30 transition-colors shrink-0"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button type="button" onClick={() => generateCurrentAffairs(user)} className="text-saffron text-xs mt-2 hover:underline">Try again</button>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map(c => (
            <button type="button"
              key={c}
              onClick={() => setFilter(c)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === c ? 'bg-saffron text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((item, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category] || 'bg-white/10 border-white/10 text-white/50'}`}>
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-sm leading-relaxed">{item.headline}</h3>
                </div>
                <button type="button"
                  onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                  className="text-white/30 hover:text-white text-xs shrink-0 transition-colors"
                >
                  {expandedItem === index ? 'Less' : 'More'}
                </button>
              </div>

              {expandedItem === index && (
                <div>
                  <p className="text-white/60 text-sm leading-relaxed mb-3">{item.summary}</p>
                  <div className="bg-saffron/5 border border-saffron/20 rounded-xl px-3 py-2 mb-3">
                    <p className="text-saffron/80 text-xs"><span className="font-semibold">Exam relevance:</span> {item.exam_relevance}</p>
                  </div>
                  <MCQCard mcq={item.mcq} />
                </div>
              )}

              {expandedItem !== index && (
                <p className="text-white/40 text-xs line-clamp-2">{item.summary}</p>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm">No items found for this category.</p>
          </div>
        )}

      </div>
    </main>
  )
}
