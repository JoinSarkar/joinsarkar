'use client'

import Link from 'next/link'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSignup() {
    if (loading) return
    setLoading(true)
    setError('')
    setMessage('')

    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Account created! Please check your email to confirm your account.')
    }

    setLoading(false)
  }

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Link href="/">
            <span className="text-saffron font-bold text-2xl">JOIN</span>
            <span className="text-white font-bold text-2xl"> SARKAR</span>
          </Link>
          <p className="text-white/50 text-sm mt-2">Create your account</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">

          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm block mb-2">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm block mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="mt-4 bg-teal/10 border border-teal/30 rounded-xl px-4 py-3">
              <p className="text-teal text-sm">{message}</p>
            </div>
          )}

          <button type="button"
            onClick={handleSignup}
            disabled={loading}
            className="w-full mt-6 bg-saffron text-white font-semibold py-3 rounded-xl hover:bg-saffron/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-white/40 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-saffron hover:underline">
              Log in
            </Link>
          </p>

        </div>
      </div>
    </main>
  )
}