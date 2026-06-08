'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

const STEPS = [
  'Personal',
  'Education',
  'Situation',
  'Preparation',
  'Goals',
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const router = useRouter()

  const [form, setForm] = useState({
    full_name: '',
    age: '',
    gender: '',
    home_state: '',
    preferred_language: '',
    education_level: '',
    graduation_year: '',
    graduation_subject: '',
    employment_status: '',
    monthly_income: '',
    financial_dependents: '',
    study_hours_per_day: '',
    preparation_start: '',
    relocation_willingness: '',
    salary_target: '',
    career_aspiration: '',
    risk_tolerance: '',
    family_responsibilities: '',
  })

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        setForm(prev => ({ ...prev, full_name: user.user_metadata?.full_name || '' }))
      }
    }
    getUser()
  }, [])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function nextStep() {
    setError('')
    setStep(prev => prev + 1)
  }

  function prevStep() {
    setError('')
    setStep(prev => prev - 1)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...form,
      age: parseInt(form.age),
      graduation_year: parseInt(form.graduation_year),
      monthly_income: parseInt(form.monthly_income),
      financial_dependents: parseInt(form.financial_dependents),
      study_hours_per_day: parseFloat(form.study_hours_per_day),
      salary_target: parseInt(form.salary_target),
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      setError('Something went wrong. Please try again.')
      console.error(error)
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  const inputClass = "w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors"
  const labelClass = "text-white/70 text-sm block mb-2"
  const selectClass = "w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-saffron transition-colors"

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen px-6 py-12 md:px-16">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <a href="/dashboard">
            <span className="text-saffron font-bold text-xl">JOIN</span>
            <span className="text-white font-bold text-xl"> SARKAR</span>
          </a>
          <h1 className="text-white text-2xl font-bold mt-6 mb-1">Build your profile</h1>
          <p className="text-white/50 text-sm">This helps us personalise everything for you. Takes 3 minutes.</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-saffron' : 'bg-white/10'}`} />
              <div className={`text-xs mt-1.5 ${i === step ? 'text-saffron' : 'text-white/30'}`}>{s}</div>
            </div>
          ))}
        </div>

        {/* Step 0 — Personal */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Full name</label>
              <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Rahul Sharma" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Age</label>
              <input type="number" value={form.age} onChange={e => update('age', e.target.value)} placeholder="24" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select value={form.gender} onChange={e => update('gender', e.target.value)} className={selectClass}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Home state</label>
              <select value={form.home_state} onChange={e => update('home_state', e.target.value)} className={selectClass}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Preferred language for study</label>
              <select value={form.preferred_language} onChange={e => update('preferred_language', e.target.value)} className={selectClass}>
                <option value="">Select language</option>
                <option>Hindi</option>
                <option>English</option>
                <option>Telugu</option>
                <option>Tamil</option>
                <option>Kannada</option>
                <option>Malayalam</option>
                <option>Marathi</option>
                <option>Bengali</option>
                <option>Gujarati</option>
                <option>Odia</option>
                <option>Punjabi</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 1 — Education */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Highest education level</label>
              <select value={form.education_level} onChange={e => update('education_level', e.target.value)} className={selectClass}>
                <option value="">Select level</option>
                <option>10th Pass</option>
                <option>12th Pass</option>
                <option>Diploma</option>
                <option>Graduate</option>
                <option>Post Graduate</option>
                <option>PhD</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Graduation year (or expected)</label>
              <input type="number" value={form.graduation_year} onChange={e => update('graduation_year', e.target.value)} placeholder="2023" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Graduation subject / stream</label>
              <input type="text" value={form.graduation_subject} onChange={e => update('graduation_subject', e.target.value)} placeholder="e.g. B.Com, B.Tech, BA History" className={inputClass} />
            </div>
          </div>
        )}

        {/* Step 2 — Situation */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Current employment status</label>
              <select value={form.employment_status} onChange={e => update('employment_status', e.target.value)} className={selectClass}>
                <option value="">Select status</option>
                <option>Unemployed — preparing full time</option>
                <option>Working — preparing alongside job</option>
                <option>Student — final year</option>
                <option>Student — not final year</option>
                <option>Running own business</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Monthly household income (₹)</label>
              <input type="number" value={form.monthly_income} onChange={e => update('monthly_income', e.target.value)} placeholder="25000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Number of financial dependents on you</label>
              <input type="number" value={form.financial_dependents} onChange={e => update('financial_dependents', e.target.value)} placeholder="2" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Family responsibilities</label>
              <select value={form.family_responsibilities} onChange={e => update('family_responsibilities', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                <option>None — fully free to focus</option>
                <option>Moderate — some responsibilities</option>
                <option>High — significant responsibilities</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3 — Preparation */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Study hours available per day</label>
              <select value={form.study_hours_per_day} onChange={e => update('study_hours_per_day', e.target.value)} className={selectClass}>
                <option value="">Select hours</option>
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="4">4 hours</option>
                <option value="5">5 hours</option>
                <option value="6">6 hours</option>
                <option value="8">8 hours</option>
                <option value="10">10+ hours</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>When did you start preparing?</label>
              <select value={form.preparation_start} onChange={e => update('preparation_start', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                <option>Just starting now</option>
                <option>Less than 6 months ago</option>
                <option>6 months to 1 year ago</option>
                <option>1 to 2 years ago</option>
                <option>More than 2 years ago</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Willing to relocate for posting?</label>
              <select value={form.relocation_willingness} onChange={e => update('relocation_willingness', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                <option>Yes — anywhere in India</option>
                <option>Yes — within my state</option>
                <option>Prefer home state but open</option>
                <option>No — must stay in home city</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Risk tolerance</label>
              <select value={form.risk_tolerance} onChange={e => update('risk_tolerance', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                <option>Low — want a safe, steady exam</option>
                <option>Medium — okay with moderate competition</option>
                <option>High — willing to attempt tough exams</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4 — Goals */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Minimum monthly salary target (₹)</label>
              <select value={form.salary_target} onChange={e => update('salary_target', e.target.value)} className={selectClass}>
                <option value="">Select range</option>
                <option value="20000">₹20,000+</option>
                <option value="30000">₹30,000+</option>
                <option value="40000">₹40,000+</option>
                <option value="50000">₹50,000+</option>
                <option value="75000">₹75,000+</option>
                <option value="100000">₹1,00,000+</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Career aspiration</label>
              <select value={form.career_aspiration} onChange={e => update('career_aspiration', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                <option>Government job for stability and pension</option>
                <option>Prestigious civil service (IAS/IPS/IFS)</option>
                <option>Defence — Army, Navy, Air Force</option>
                <option>Banking and financial services</option>
                <option>Teaching and education sector</option>
                <option>Any government job — as fast as possible</option>
              </select>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-10">
          {step > 0 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 text-sm font-medium hover:border-white/30 transition-colors"
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button
              onClick={nextStep}
              className="flex-1 py-3 rounded-xl bg-saffron text-white text-sm font-semibold hover:bg-saffron/90 transition-colors"
            >
              Continue
            </button>
          )}
          {step === STEPS.length - 1 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-saffron text-white text-sm font-semibold hover:bg-saffron/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete profile'}
            </button>
          )}
        </div>

      </div>
    </main>
  )
}