'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

const CATEGORIES = ['Government', 'Economy', 'International', 'Science', 'Sports', 'Awards', 'Legal', 'Defence']

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="text-white/40 text-xs font-medium tracking-widest mb-2">{label}</div>
      <div className="text-white text-3xl font-bold">{value}</div>
      {sub && <div className="text-white/40 text-xs mt-1">{sub}</div>}
    </div>
  )
}

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [affairs, setAffairs] = useState([])
  const [cacheStats, setCacheStats] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const router = useRouter()

  const emptyForm = {
    title: '',
    summary: '',
    category: 'Government',
    exam_relevance: '',
    publish_date: new Date().toISOString().split('T')[0],
    digest_type: 'daily',
    is_published: false,
    mcq_question: '',
    mcq_a: '',
    mcq_b: '',
    mcq_c: '',
    mcq_d: '',
    mcq_correct: 'A',
    mcq_explanation: '',
  }

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!adminCheck) { router.push('/dashboard'); return }
      setIsAdmin(true)

      await loadStats(supabase)
      await loadAffairs(supabase)
      await loadCacheStats(supabase)
      setLoading(false)
    }
    load()
  }, [])

  async function loadStats(supabase) {
    const [usersRes, subsRes, checkinRes, plansRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('subscriptions').select('plan, status'),
      supabase.from('daily_checkins').select('id', { count: 'exact' }),
      supabase.from('study_plans').select('id', { count: 'exact' }),
    ])

    const subs = subsRes.data || []
    const activeSubs = subs.filter(s => s.status === 'active')
    const objectiveSubs = activeSubs.filter(s => s.plan === 'objective')
    const advancedSubs = activeSubs.filter(s => s.plan === 'advanced')
    const revenue = (objectiveSubs.length * 299) + (advancedSubs.length * 499)

    setStats({
      totalUsers: usersRes.count || 0,
      activeSubs: activeSubs.length,
      objectiveSubs: objectiveSubs.length,
      advancedSubs: advancedSubs.length,
      estimatedRevenue: revenue,
      totalCheckins: checkinRes.count || 0,
      totalPlans: plansRes.count || 0,
    })
  }

  async function loadAffairs(supabase) {
    const { data } = await supabase
      .from('admin_current_affairs')
      .select('*')
      .order('publish_date', { ascending: false })
      .limit(50)
    setAffairs(data || [])
  }

  async function loadCacheStats(supabase) {
    const [quizRes, notesRes, affairsRes] = await Promise.all([
      supabase.from('quiz_cache').select('id', { count: 'exact' }),
      supabase.from('notes_cache').select('id', { count: 'exact' }),
      supabase.from('current_affairs').select('id', { count: 'exact' }),
    ])
    setCacheStats({
      quizCached: quizRes.count || 0,
      notesCached: notesRes.count || 0,
      affairsCached: affairsRes.count || 0,
    })
  }

  async function handleSaveAffair() {
    if (!form.title || !form.summary || !form.publish_date) {
      setError('Title, summary, and publish date are required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    const supabase = createClient()

    const mcq = form.mcq_question ? {
      question: form.mcq_question,
      options: { A: form.mcq_a, B: form.mcq_b, C: form.mcq_c, D: form.mcq_d },
      correct: form.mcq_correct,
      explanation: form.mcq_explanation,
    } : null

    const payload = {
      title: form.title,
      summary: form.summary,
      category: form.category,
      exam_relevance: form.exam_relevance,
      publish_date: form.publish_date,
      digest_type: form.digest_type,
      is_published: form.is_published,
      mcq,
      created_by: user.id,
    }

    let result
    if (editItem) {
      result = await supabase.from('admin_current_affairs').update(payload).eq('id', editItem.id)
    } else {
      result = await supabase.from('admin_current_affairs').insert(payload)
    }

    if (result.error) {
      setError('Failed to save. Please try again.')
    } else {
      setSuccess(editItem ? 'Updated successfully.' : 'Saved successfully.')
      setForm(emptyForm)
      setShowForm(false)
      setEditItem(null)
      await loadAffairs(supabase)
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  async function handleTogglePublish(id, current) {
    const supabase = createClient()
    await supabase.from('admin_current_affairs').update({ is_published: !current }).eq('id', id)
    setAffairs(prev => prev.map(a => a.id === id ? { ...a, is_published: !current } : a))
  }

  async function handleDelete(id) {
    if (!confirm('Delete this item?')) return
    const supabase = createClient()
    await supabase.from('admin_current_affairs').delete().eq('id', id)
    setAffairs(prev => prev.filter(a => a.id !== id))
  }

  async function handleClearCache(table) {
    if (!confirm('Clear ' + table + ' cache? Users will get fresh AI-generated content next time.')) return
    const supabase = createClient()
    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await loadCacheStats(supabase)
    setSuccess(table + ' cache cleared.')
    setTimeout(() => setSuccess(''), 3000)
  }

  function handleEdit(item) {
    setEditItem(item)
    setForm({
      title: item.title || '',
      summary: item.summary || '',
      category: item.category || 'Government',
      exam_relevance: item.exam_relevance || '',
      publish_date: item.publish_date || '',
      digest_type: item.digest_type || 'daily',
      is_published: item.is_published || false,
      mcq_question: item.mcq?.question || '',
      mcq_a: item.mcq?.options?.A || '',
      mcq_b: item.mcq?.options?.B || '',
      mcq_c: item.mcq?.options?.C || '',
      mcq_d: item.mcq?.options?.D || '',
      mcq_correct: item.mcq?.correct || 'A',
      mcq_explanation: item.mcq?.explanation || '',
    })
    setShowForm(true)
    setActiveTab('affairs')
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!isAdmin) return null

  const inputClass = "w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
  const selectClass = "w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-saffron transition-colors"
  const tabs = ['stats', 'affairs', 'cache']

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen px-6 py-12 md:px-16">
      <div className="max-w-5xl mx-auto">

        <div className="mb-10 flex items-center justify-between">
          <div>
            <a href="/dashboard">
              <span className="text-saffron font-bold text-xl">JOIN</span>
              <span className="text-white font-bold text-xl"> SARKAR</span>
            </a>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-saffron/20 text-saffron border border-saffron/30 px-2 py-0.5 rounded-full">Admin</span>
              <h1 className="text-white font-bold text-xl">Dashboard</h1>
            </div>
          </div>
          <a href="/dashboard" className="text-white/40 text-sm hover:text-white transition-colors">Back to app</a>
        </div>

        {success && (
          <div className="mb-6 bg-teal/10 border border-teal/20 rounded-xl px-4 py-3">
            <p className="text-teal text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2 mb-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-saffron text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
              {tab === 'affairs' ? 'Current Affairs' : tab === 'cache' ? 'Cache' : 'Stats'}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && stats && (
          <div>
            <h2 className="text-white font-semibold text-lg mb-4">Product overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <StatCard label="TOTAL USERS" value={stats.totalUsers} sub="profiles created" />
              <StatCard label="ACTIVE SUBS" value={stats.activeSubs} sub="paying users" />
              <StatCard label="EST. REVENUE" value={"Rs " + stats.estimatedRevenue} sub="this month" />
              <StatCard label="TOTAL CHECKINS" value={stats.totalCheckins} sub="across all users" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="OBJECTIVE TRACK" value={stats.objectiveSubs} sub="at Rs 299/month" />
              <StatCard label="ADVANCED TRACK" value={stats.advancedSubs} sub="at Rs 499/month" />
              <StatCard label="STUDY PLANS" value={stats.totalPlans} sub="generated" />
            </div>
          </div>
        )}

        {activeTab === 'affairs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold text-lg">Current Affairs Manager</h2>
              <button
                onClick={() => { setShowForm(!showForm); setEditItem(null); setForm(emptyForm) }}
                className="bg-saffron text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-saffron/90 transition-colors"
              >
                {showForm ? 'Cancel' : '+ Add item'}
              </button>
            </div>

            {showForm && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                <h3 className="text-white font-semibold mb-5">{editItem ? 'Edit item' : 'Add new item'}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/70 text-sm block mb-2">Category</label>
                      <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={selectClass}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/70 text-sm block mb-2">Digest type</label>
                      <select value={form.digest_type} onChange={e => setForm(p => ({ ...p, digest_type: e.target.value }))} className={selectClass}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/70 text-sm block mb-2">Headline / Title</label>
                    <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Short headline" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm block mb-2">Summary</label>
                    <textarea value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} placeholder="2-3 sentence summary" rows={3} className={inputClass + " resize-none"} />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm block mb-2">Exam relevance</label>
                    <input type="text" value={form.exam_relevance} onChange={e => setForm(p => ({ ...p, exam_relevance: e.target.value }))} placeholder="e.g. Relevant for SSC GK and UPSC Prelims" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/70 text-sm block mb-2">Publish date</label>
                      <input type="date" value={form.publish_date} onChange={e => setForm(p => ({ ...p, publish_date: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div
                          onClick={() => setForm(p => ({ ...p, is_published: !p.is_published }))}
                          className={`w-10 h-6 rounded-full transition-colors ${form.is_published ? 'bg-teal' : 'bg-white/20'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-all ${form.is_published ? 'ml-5' : 'ml-1'}`} />
                        </div>
                        <span className="text-white/70 text-sm">Publish now</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-white/50 text-xs mb-4">MCQ (optional)</p>
                    <div className="space-y-3">
                      <input type="text" value={form.mcq_question} onChange={e => setForm(p => ({ ...p, mcq_question: e.target.value }))} placeholder="MCQ question" className={inputClass} />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={form.mcq_a} onChange={e => setForm(p => ({ ...p, mcq_a: e.target.value }))} placeholder="Option A" className={inputClass} />
                        <input type="text" value={form.mcq_b} onChange={e => setForm(p => ({ ...p, mcq_b: e.target.value }))} placeholder="Option B" className={inputClass} />
                        <input type="text" value={form.mcq_c} onChange={e => setForm(p => ({ ...p, mcq_c: e.target.value }))} placeholder="Option C" className={inputClass} />
                        <input type="text" value={form.mcq_d} onChange={e => setForm(p => ({ ...p, mcq_d: e.target.value }))} placeholder="Option D" className={inputClass} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-white/70 text-sm block mb-2">Correct answer</label>
                          <select value={form.mcq_correct} onChange={e => setForm(p => ({ ...p, mcq_correct: e.target.value }))} className={selectClass}>
                            <option>A</option><option>B</option><option>C</option><option>D</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-white/70 text-sm block mb-2">Explanation</label>
                          <input type="text" value={form.mcq_explanation} onChange={e => setForm(p => ({ ...p, mcq_explanation: e.target.value }))} placeholder="Brief explanation" className={inputClass} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveAffair}
                  disabled={saving}
                  className="w-full mt-6 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editItem ? 'Update item' : 'Save item'}
                </button>
              </div>
            )}

            {affairs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/30 text-sm">No current affairs items yet.</p>
                <p className="text-white/20 text-xs mt-1">Add items above to replace AI-generated content.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {affairs.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${item.is_published ? 'bg-teal/10 border-teal/20 text-teal' : 'bg-white/10 border-white/10 text-white/40'}`}>
                            {item.is_published ? 'Published' : 'Draft'}
                          </span>
                          <span className="text-white/40 text-xs">{item.category}</span>
                          <span className="text-white/40 text-xs">{item.digest_type}</span>
                          <span className="text-white/40 text-xs">{item.publish_date}</span>
                        </div>
                        <p className="text-white font-medium text-sm">{item.title}</p>
                        <p className="text-white/50 text-xs mt-1 line-clamp-2">{item.summary}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleTogglePublish(item.id, item.is_published)} className={`text-xs px-2 py-1 rounded-lg border transition-colors ${item.is_published ? 'border-white/10 text-white/40 hover:text-white' : 'border-teal/30 text-teal hover:bg-teal/10'}`}>
                          {item.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={() => handleEdit(item)} className="text-xs px-2 py-1 rounded-lg border border-white/10 text-white/40 hover:text-white transition-colors">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="text-xs px-2 py-1 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 transition-colors">Del</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cache' && cacheStats && (
          <div>
            <h2 className="text-white font-semibold text-lg mb-4">Cache Management</h2>
            <p className="text-white/50 text-sm mb-6">Cached content saves API tokens. Clear only when content needs to be refreshed.</p>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">Quiz cache</div>
                  <div className="text-white/40 text-xs mt-0.5">{cacheStats.quizCached} subjects cached — saves 5 API calls per subject per day</div>
                </div>
                <button onClick={() => handleClearCache('quiz_cache')} className="text-xs px-3 py-2 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 transition-colors shrink-0">Clear</button>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">Notes cache</div>
                  <div className="text-white/40 text-xs mt-0.5">{cacheStats.notesCached} subjects cached — permanent cache, never expires</div>
                </div>
                <button onClick={() => handleClearCache('notes_cache')} className="text-xs px-3 py-2 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 transition-colors shrink-0">Clear</button>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">Current affairs cache</div>
                  <div className="text-white/40 text-xs mt-0.5">{cacheStats.affairsCached} days cached — clears automatically after 24 hours</div>
                </div>
                <button onClick={() => handleClearCache('current_affairs')} className="text-xs px-3 py-2 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 transition-colors shrink-0">Clear</button>
              </div>
              <div className="bg-saffron/5 border border-saffron/20 rounded-2xl p-5">
                <p className="text-saffron/80 text-xs leading-relaxed">
                  <span className="font-semibold">Token savings so far:</span> Each cached quiz saves ~1,500 tokens. Each cached notes saves ~800 tokens. Each cached current affairs day saves ~4,000 tokens. With {cacheStats.quizCached + cacheStats.notesCached} items cached, you have saved approximately {((cacheStats.quizCached * 1500) + (cacheStats.notesCached * 800)).toLocaleString()} tokens.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
