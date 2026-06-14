'use client'

import Link from 'next/link'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function PricingPage() {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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

  async function handlePayment(plan) {
    setPaying(true)
    setError('')

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_order', plan, userId: user.id }),
      })

      const orderData = await response.json()
      if (orderData.error) { setError(orderData.error); setPaying(false); return }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Join Sarkar',
        description: orderData.planName,
        order_id: orderData.orderId,
        handler: async function(response) {
          const verifyRes = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'verify_payment',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              userId: user.id,
            }),
          })

          const verifyData = await verifyRes.json()

          if (verifyData.verified) {
            const supabase = createClient()
            const now = new Date()
            const end = new Date()
            end.setDate(end.getDate() + 30)

            await supabase.from('subscriptions').upsert({
              user_id: user.id,
              plan,
              status: 'active',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              current_period_start: now.toISOString(),
              current_period_end: end.toISOString(),
              updated_at: now.toISOString(),
            })

            router.push('/dashboard')
          } else {
            setError('Payment verification failed. Please contact support.')
          }
          setPaying(false)
        },
        prefill: {
          email: user.email,
          name: user.user_metadata?.full_name || '',
        },
        theme: { color: '#D85A30' },
        modal: {
          ondismiss: function() { setPaying(false) }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setPaying(false)
    }
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

        <div className="mb-10 text-center">
          <Link href="/dashboard">
            <span className="text-saffron font-bold text-xl">JOIN</span>
            <span className="text-white font-bold text-xl"> SARKAR</span>
          </Link>
          <h1 className="text-white text-2xl font-bold mt-6 mb-2">Choose your plan</h1>
          <p className="text-white/50 text-sm">Cancel anytime. No hidden fees.</p>
        </div>

        {subscription?.status === 'active' && (
          <div className="mb-8 bg-teal/10 border border-teal/20 rounded-2xl p-5 text-center">
            <p className="text-teal font-semibold">You are on the {subscription.plan === 'objective' ? 'Objective' : 'Advanced'} Track</p>
            <p className="text-white/50 text-sm mt-1">
              Active until {new Date(subscription.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold text-lg">Objective Track</h3>
            <p className="text-white/50 text-sm mt-1 mb-4">SSC, Banking, Railways</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-white text-4xl font-bold">Rs 299</span>
              <span className="text-white/40 text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-8">
              {['Exam recommendations', 'AI study plan', 'Mock tests', 'Daily current affairs', 'Accountability tracking'].map(f => (
                <li key={f} className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-teal">✓</span> {f}
                </li>
              ))}
            </ul>
            <button type="button"
              onClick={() => handlePayment('objective')}
              disabled={paying || subscription?.status === 'active'}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              {subscription?.plan === 'objective' && subscription?.status === 'active' ? 'Current plan' : paying ? 'Processing...' : 'Get started'}
            </button>
          </div>

          <div className="bg-saffron/10 border border-saffron/40 rounded-2xl p-6">
            <div className="text-saffron text-xs font-bold tracking-widest mb-4">MOST POPULAR</div>
            <h3 className="text-white font-bold text-lg">Advanced Track</h3>
            <p className="text-white/50 text-sm mt-1 mb-4">UPSC, State PCS, Judiciary</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-white text-4xl font-bold">Rs 499</span>
              <span className="text-white/40 text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-8">
              {['Everything in Objective', 'Mains answer writing', 'Essay feedback', 'Interview preparation', 'Priority support'].map(f => (
                <li key={f} className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-teal">✓</span> {f}
                </li>
              ))}
            </ul>
            <button type="button"
              onClick={() => handlePayment('advanced')}
              disabled={paying || subscription?.status === 'active'}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-saffron text-white hover:bg-saffron/90 transition-colors disabled:opacity-50"
            >
              {subscription?.plan === 'advanced' && subscription?.status === 'active' ? 'Current plan' : paying ? 'Processing...' : 'Get started'}
            </button>
          </div>

        </div>

        <p className="text-white/30 text-xs text-center mt-8">
          Payments are processed securely by Razorpay. Your card details are never stored on our servers.
        </p>

      </div>
    </main>
  )
}
