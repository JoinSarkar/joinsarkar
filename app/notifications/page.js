'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

const NOTIFICATION_TYPES = [
  { value: 'notification', label: 'Official Notification', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { value: 'application', label: 'Application Deadline', color: 'text-saffron', bg: 'bg-saffron/10 border-saffron/20' },
  { value: 'admit_card', label: 'Admit Card', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { value: 'exam_date', label: 'Exam Date', color: 'text-teal', bg: 'bg-teal/10 border-teal/20' },
  { value: 'result', label: 'Result', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
]

function getDaysLeft(date) {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function DaysLeftBadge({ date }) {
  const days = getDaysLeft(date)
  if (days === null) return null
  if (days < 0) return <span className="text-xs text-white/30">Passed</span>
  if (days === 0) return <span className="text-xs text-red-400 font-bold">Today</span>
  if (days <= 3) return <span className="text-xs text-red-400 font-semibold">{days}d left</span>
  if (days <= 7) return <span className="text-xs text-orange-400">{days}d left</span>
  if (days <= 30) return <span className="text-xs text-saffron">{days}d left</span>
  return <span className="text-xs text-white/40">{days}d left</span>
}

export default function NotificationsPage() {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [fetchMessage, setFetchMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [exams, setExams] = useState([])
  const [form, setForm] = useState({
    exam_name: '',
    notification_type: 'notification',
    title: '',
    description: '',
    important_date: '',
    url: '',
  })
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: examsData } = await supabase
        .from('exam_recommendations')
        .select('exam_name')
        .eq('user_id', user.id)
        .eq('is_active', true)

      setExams(examsData || [])
      if (examsData && examsData.length > 0) {
        setForm(prev => ({ ...prev, exam_name: examsData[0].exam_name }))
      }

      const { data: notifs } = await supabase
        .from('exam_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('important_date', { ascending: true, nullsFirst: false })

      setNotifications(notifs || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAutoFetch() {
    if (!exams.length) { setError('No active exams found. Please complete exam recommendations first.'); return }
    setFetching(true)
    setError('')
    setFetchMessage('Searching the web for latest notifications...')

    try {
      const response = await fetch('/api/fetchnotifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exams: exams.map(e => e.exam_name) }),
      })

      const data = await response.json()
      if (data.error) { setError(data.error); setFetching(false); setFetchMessage(''); return }

      const supabase = createClient()
      let added = 0

      for (const notif of data.notifications) {
        const { error: insertError } = await supabase
          .from('exam_notifications')
          .insert({ ...notif, user_id: user.id })

        if (!insertError) added++
      }

      const { data: updated } = await supabase
        .from('exam_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('important_date', { ascending: true, nullsFirst: false })

      setNotifications(updated || [])
      setFetchMessage(`Added ${added} new notifications from the web.`)
      setTimeout(() => setFetchMessage(''), 4000)
    } catch (e) {
      setError('Failed to fetch notifications. Please try again.')
    }
    setFetching(false)
  }

  async function handleAdd() {
    if (!form.title || !form.exam_name) { setError('Please fill in exam name and title.'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()

    const { data, error: insertError } = await supabase
      .from('exam_notifications')
      .insert({ ...form, user_id: user.id })
      .select()
      .single()

    if (insertError) {
      setError('Failed to save. Please try again.')
    } else {
      setNotifications(prev => [...prev, data].sort((a, b) => {
        if (!a.important_date) return 1
        if (!b.important_date) return -1
        return new Date(a.important_date) - new Date(b.important_date)
      }))
      setForm({ exam_name: exams[0]?.exam_name || '', notification_type: 'notification', title: '', description: '', important_date: '', url: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function togglePin(id, current) {
    const supabase = createClient()
    await supabase.from('exam_notifications').update({ is_pinned: !current }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_pinned: !current } : n))
  }

  async function markRead(id) {
    const supabase = createClient()
    await supabase.from('exam_notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function deleteNotif(id) {
    const supabase = createClient()
    await supabase.from('exam_notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'pinned') return n.is_pinned
    if (filter === 'unread') return !n.is_read
    return n.notification_type === filter
  })

  const inputClass = "w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
  const selectClass = "w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-saffron transition-colors"

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Loading notifications...</p>
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
              <h1 className="text-white text-2xl font-bold mb-1">Exam tracker</h1>
              <p className="text-white/50 text-sm">Track notifications, deadlines, admit cards, and results</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleAutoFetch}
                disabled={fetching}
                className="bg-saffron text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50"
              >
                {fetching ? 'Searching...' : 'Auto-fetch'}
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-white/20 transition-colors"
              >
                {showForm ? 'Cancel' : '+ Add'}
              </button>
            </div>
          </div>
        </div>

        {fetchMessage && (
          <div className="mb-6 bg-teal/10 border border-teal/20 rounded-xl px-4 py-3">
            <p className="text-teal text-sm">{fetchMessage}</p>
          </div>
        )}

        {fetching && (
          <div className="mb-6 bg-white/5 border border-white/10 rounded-xl px-4 py-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-saffron border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-white/50 text-sm">Searching the web for latest exam notifications... This takes about 20 seconds.</p>
          </div>
        )}

        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-white font-semibold mb-5">Add manually</h2>
            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-2">Exam</label>
                <select value={form.exam_name} onChange={e => setForm(p => ({ ...p, exam_name: e.target.value }))} className={selectClass}>
                  {exams.map(e => <option key={e.exam_name}>{e.exam_name}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Type</label>
                <select value={form.notification_type} onChange={e => setForm(p => ({ ...p, notification_type: e.target.value }))} className={selectClass}>
                  {NOTIFICATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. SSC CGL 2024 notification released" className={inputClass} />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Description (optional)</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Any additional details" className={inputClass} />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Important date</label>
                <input type="date" value={form.important_date} onChange={e => setForm(p => ({ ...p, important_date: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Official URL (optional)</label>
                <input type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://ssc.nic.in" className={inputClass} />
              </div>
            </div>
            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <button onClick={handleAdd} disabled={saving} className="w-full mt-5 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save entry'}
            </button>
          </div>
        )}

        {error && !showForm && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {['all', 'pinned', 'unread', 'application', 'admit_card', 'exam_date', 'result'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-saffron text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm mb-2">No entries yet.</p>
            <p className="text-white/20 text-xs mb-6">Click Auto-fetch to search for latest exam notifications automatically.</p>
            <button onClick={handleAutoFetch} disabled={fetching} className="bg-saffron text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50">
              {fetching ? 'Searching...' : 'Auto-fetch notifications'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => {
              const type = NOTIFICATION_TYPES.find(t => t.value === n.notification_type)
              return (
                <div
                  key={n.id}
                  className={`bg-white/5 border rounded-2xl p-5 transition-opacity ${n.is_read ? 'opacity-60' : ''} ${n.is_pinned ? 'border-saffron/30' : 'border-white/10'}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {n.is_pinned && <span className="text-saffron text-xs">pinned</span>}
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-saffron shrink-0" />}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${type?.bg || 'bg-white/10 border-white/10'} ${type?.color || 'text-white/50'}`}>
                          {type?.label || n.notification_type}
                        </span>
                        <span className="text-white/40 text-xs">{n.exam_name}</span>
                      </div>
                      <p className="text-white font-medium text-sm mb-1">{n.title}</p>
                      {n.description && <p className="text-white/50 text-xs mb-2">{n.description}</p>}
                      <div className="flex items-center gap-3 flex-wrap">
                        {n.important_date && (
                          <span className="text-white/40 text-xs">
                            {new Date(n.important_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        <DaysLeftBadge date={n.important_date} />
                        {n.url && (
                          <a href={n.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-saffron text-xs hover:underline">
                            Official link
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button onClick={e => { e.stopPropagation(); togglePin(n.id, n.is_pinned) }} className="text-white/30 hover:text-saffron text-xs transition-colors">pin</button>
                      <button onClick={e => { e.stopPropagation(); deleteNotif(n.id) }} className="text-white/30 hover:text-red-400 text-xs transition-colors">delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}
