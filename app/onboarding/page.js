'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

const STEPS = ['Identity', 'Education', 'Family', 'Dream Job', 'Situation', 'Preparation']

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
]

const UPSC_OPTIONALS = [
  { subject: 'Agriculture', category: 'agriculture' },
  { subject: 'Animal Husbandry and Veterinary Science', category: 'science' },
  { subject: 'Anthropology', category: 'humanities' },
  { subject: 'Botany', category: 'science' },
  { subject: 'Chemistry', category: 'science' },
  { subject: 'Civil Engineering', category: 'engineering' },
  { subject: 'Commerce and Accountancy', category: 'humanities' },
  { subject: 'Economics', category: 'humanities' },
  { subject: 'Electrical Engineering', category: 'engineering' },
  { subject: 'Geography', category: 'humanities' },
  { subject: 'Geology', category: 'science' },
  { subject: 'History', category: 'humanities' },
  { subject: 'Law', category: 'humanities' },
  { subject: 'Management', category: 'humanities' },
  { subject: 'Mathematics', category: 'science' },
  { subject: 'Mechanical Engineering', category: 'engineering' },
  { subject: 'Medical Science', category: 'medical' },
  { subject: 'Philosophy', category: 'humanities' },
  { subject: 'Physics', category: 'science' },
  { subject: 'Political Science and International Relations', category: 'humanities' },
  { subject: 'Psychology', category: 'humanities' },
  { subject: 'Public Administration', category: 'humanities' },
  { subject: 'Sociology', category: 'humanities' },
  { subject: 'Statistics', category: 'science' },
  { subject: 'Zoology', category: 'science' },
]

const DREAM_JOBS = [
  { label: 'IAS Officer', track: 'civil_services' },
  { label: 'IPS Officer', track: 'civil_services' },
  { label: 'IFS Officer (Foreign Service)', track: 'civil_services' },
  { label: 'IRS Officer', track: 'civil_services' },
  { label: 'State PCS Officer', track: 'civil_services' },
  { label: 'Indian Army Officer', track: 'army' },
  { label: 'Indian Navy Officer', track: 'navy' },
  { label: 'Indian Air Force Officer', track: 'airforce' },
  { label: 'Bank Probationary Officer', track: 'banking' },
  { label: 'RBI Officer', track: 'banking' },
  { label: 'Railways Officer', track: 'railways' },
  { label: 'SSC Gazetted Officer', track: 'ssc' },
  { label: 'Income Tax Inspector', track: 'ssc' },
  { label: 'Central Excise Inspector', track: 'ssc' },
  { label: 'Government School Teacher', track: 'teaching' },
  { label: 'College Professor', track: 'teaching' },
  { label: 'Any Stable Government Job', track: 'ssc' },
]

const CIVIL_SERVICES_TRACKS = ['civil_services']

function needsUPSCOptional(dreamJobTrack, careerAspiration) {
  return CIVIL_SERVICES_TRACKS.includes(dreamJobTrack) ||
    (careerAspiration && (
      careerAspiration.toLowerCase().includes('upsc') ||
      careerAspiration.toLowerCase().includes('ias') ||
      careerAspiration.toLowerCase().includes('ips') ||
      careerAspiration.toLowerCase().includes('civil service')
    ))
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [existingProfile, setExistingProfile] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    home_state: '',
    home_district: '',
    preferred_language: '',
    religion: '',
    category: '',
    education_level: '',
    graduation_year: '',
    graduation_subject: '',
    graduation_percentage: '',
    twelfth_stream: '',
    twelfth_percentage: '',
    is_first_generation_aspirant: false,
    father_occupation: '',
    mother_occupation: '',
    number_of_siblings: '',
    birth_order: '',
    family_type: '',
    dream_job: '',
    dream_job_track: '',
    career_aspiration: '',
    upsc_optional_subject: '',
    upsc_optional_category: '',
    employment_status: '',
    monthly_income: '',
    financial_dependents: '',
    study_hours_per_day: '',
    preparation_start: '',
    relocation_willingness: '',
    salary_target: '',
    risk_tolerance: '',
    family_responsibilities: '',
    current_attempt_number: '1',
    has_coaching: false,
    coaching_type: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setExistingProfile(profile)
        setIsLocked(profile.fixed_fields_locked || false)
        setForm(prev => ({
          ...prev,
          full_name: profile.full_name || '',
          date_of_birth: profile.date_of_birth || '',
          gender: profile.gender || '',
          home_state: profile.home_state || '',
          home_district: profile.home_district || '',
          preferred_language: profile.preferred_language || '',
          religion: profile.religion || '',
          category: profile.category || '',
          education_level: profile.education_level || '',
          graduation_year: profile.graduation_year || '',
          graduation_subject: profile.graduation_subject || '',
          graduation_percentage: profile.graduation_percentage || '',
          twelfth_stream: profile.twelfth_stream || '',
          twelfth_percentage: profile.twelfth_percentage || '',
          is_first_generation_aspirant: profile.is_first_generation_aspirant || false,
          father_occupation: profile.father_occupation || '',
          mother_occupation: profile.mother_occupation || '',
          number_of_siblings: profile.number_of_siblings || '',
          birth_order: profile.birth_order || '',
          family_type: profile.family_type || '',
          dream_job: profile.dream_job || '',
          dream_job_track: profile.dream_job_track || '',
          career_aspiration: profile.career_aspiration || '',
          upsc_optional_subject: profile.upsc_optional_subject || '',
          upsc_optional_category: profile.upsc_optional_category || '',
          employment_status: profile.employment_status || '',
          monthly_income: profile.monthly_income || '',
          financial_dependents: profile.financial_dependents || '',
          study_hours_per_day: profile.study_hours_per_day || '',
          preparation_start: profile.preparation_start || '',
          relocation_willingness: profile.relocation_willingness || '',
          salary_target: profile.salary_target || '',
          risk_tolerance: profile.risk_tolerance || '',
          family_responsibilities: profile.family_responsibilities || '',
          current_attempt_number: profile.current_attempt_number || '1',
          has_coaching: profile.has_coaching || false,
          coaching_type: profile.coaching_type || '',
        }))
      } else {
        setForm(prev => ({
          ...prev,
          full_name: user.user_metadata?.full_name || '',
        }))
      }
      setLoading(false)
    }
    load()
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
    if (saving) return
    setSaving(true)
    setError('')
    const supabase = createClient()

    const showsUPSCOptional = needsUPSCOptional(form.dream_job_track, form.career_aspiration)

    const payload = {
      id: user.id,
      full_name: form.full_name,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender,
      home_state: form.home_state,
      home_district: form.home_district,
      preferred_language: form.preferred_language,
      religion: form.religion,
      category: form.category,
      education_level: form.education_level,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      graduation_subject: form.graduation_subject,
      graduation_percentage: form.graduation_percentage ? parseFloat(form.graduation_percentage) : null,
      twelfth_stream: form.twelfth_stream,
      twelfth_percentage: form.twelfth_percentage ? parseFloat(form.twelfth_percentage) : null,
      is_first_generation_aspirant: form.is_first_generation_aspirant,
      father_occupation: form.father_occupation,
      mother_occupation: form.mother_occupation,
      number_of_siblings: form.number_of_siblings ? parseInt(form.number_of_siblings) : null,
      birth_order: form.birth_order ? parseInt(form.birth_order) : null,
      family_type: form.family_type,
      dream_job: form.dream_job,
      dream_job_track: form.dream_job_track,
      career_aspiration: form.career_aspiration,
      upsc_optional_subject: showsUPSCOptional ? form.upsc_optional_subject : null,
      upsc_optional_category: showsUPSCOptional ? form.upsc_optional_category : null,
      employment_status: form.employment_status,
      monthly_income: form.monthly_income ? parseInt(form.monthly_income) : null,
      financial_dependents: form.financial_dependents ? parseInt(form.financial_dependents) : null,
      study_hours_per_day: form.study_hours_per_day ? parseFloat(form.study_hours_per_day) : null,
      preparation_start: form.preparation_start,
      relocation_willingness: form.relocation_willingness,
      salary_target: form.salary_target ? parseInt(form.salary_target) : null,
      risk_tolerance: form.risk_tolerance,
      family_responsibilities: form.family_responsibilities,
      current_attempt_number: form.current_attempt_number ? parseInt(form.current_attempt_number) : 1,
      has_coaching: form.has_coaching,
      coaching_type: form.coaching_type,
      onboarding_complete: true,
      fixed_fields_locked: true,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('profiles').upsert(payload)

    if (error) {
      setError('Something went wrong. Please try again.')
      console.error(error)
      setSaving(false)
      return
    }

    router.push('/recommendations')
    setSaving(false)
  }

  const inputClass = "w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-saffron transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  const selectClass = "w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-saffron transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  const labelClass = "text-white/70 text-sm block mb-2"

  const showUPSCOptional = needsUPSCOptional(form.dream_job_track, form.career_aspiration)

  const steps = ['Identity', 'Education', 'Family', 'Dream Job', ...(showUPSCOptional ? ['Optional Subject'] : []), 'Situation', 'Preparation']
  const totalSteps = steps.length

  if (loading) {
    return (
      <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: 'var(--ink)' }} className="min-h-screen px-6 py-12 md:px-16">
      <div className="max-w-xl mx-auto">

        <div className="mb-10">
          <a href="/dashboard">
            <span className="text-saffron font-bold text-xl">JOIN</span>
            <span className="text-white font-bold text-xl"> SARKAR</span>
          </a>
          <h1 className="text-white text-2xl font-bold mt-6 mb-1">
            {existingProfile?.onboarding_complete ? 'Update your profile' : 'Build your profile'}
          </h1>
          <p className="text-white/50 text-sm">
            {isLocked ? 'Fixed details are locked. Only dynamic fields can be updated.' : 'Takes 5 minutes. Helps us personalise everything.'}
          </p>
        </div>

        <div className="flex gap-1.5 mb-10 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 min-w-0">
              <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-saffron' : 'bg-white/10'}`} />
              <div className={`text-xs mt-1.5 truncate ${i === step ? 'text-saffron' : 'text-white/30'}`}>{s}</div>
            </div>
          ))}
        </div>

        {isLocked && step < 4 && (
          <div className="mb-6 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-white/40 text-xs">These details are locked after first submission. Contact support to make changes.</p>
          </div>
        )}

        {/* Step 0 — Identity */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Full name</label>
              <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="As per documents" className={inputClass} disabled={isLocked} />
            </div>
            <div>
              <label className={labelClass}>Date of birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} className={inputClass} disabled={isLocked} />
              {form.date_of_birth && (
                <p className="text-white/40 text-xs mt-1">
                  Age: {Math.floor((new Date() - new Date(form.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))} years
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select value={form.gender} onChange={e => update('gender', e.target.value)} className={selectClass} disabled={isLocked}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={e => update('category', e.target.value)} className={selectClass} disabled={isLocked}>
                <option value="">Select</option>
                <option>General</option>
                <option>OBC</option>
                <option>SC</option>
                <option>ST</option>
                <option>EWS</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Home state</label>
              <select value={form.home_state} onChange={e => update('home_state', e.target.value)} className={selectClass} disabled={isLocked}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Home district</label>
              <input type="text" value={form.home_district} onChange={e => update('home_district', e.target.value)} placeholder="e.g. Varanasi" className={inputClass} disabled={isLocked} />
            </div>
            <div>
              <label className={labelClass}>Preferred study language</label>
              <select value={form.preferred_language} onChange={e => update('preferred_language', e.target.value)} className={selectClass} disabled={isLocked}>
                <option value="">Select language</option>
                <option>Hindi</option><option>English</option><option>Telugu</option>
                <option>Tamil</option><option>Kannada</option><option>Malayalam</option>
                <option>Marathi</option><option>Bengali</option><option>Gujarati</option>
                <option>Odia</option><option>Punjabi</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Religion (optional)</label>
              <select value={form.religion} onChange={e => update('religion', e.target.value)} className={selectClass} disabled={isLocked}>
                <option value="">Prefer not to say</option>
                <option>Hindu</option><option>Muslim</option><option>Christian</option>
                <option>Sikh</option><option>Buddhist</option><option>Jain</option><option>Other</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 1 — Education */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Highest education level</label>
              <select value={form.education_level} onChange={e => update('education_level', e.target.value)} className={selectClass} disabled={isLocked}>
                <option value="">Select</option>
                <option>10th Pass</option><option>12th Pass</option><option>Diploma</option>
                <option>Graduate</option><option>Post Graduate</option><option>PhD</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>12th stream</label>
              <select value={form.twelfth_stream} onChange={e => update('twelfth_stream', e.target.value)} className={selectClass} disabled={isLocked}>
                <option value="">Select</option>
                <option>Science (PCM)</option><option>Science (PCB)</option>
                <option>Commerce</option><option>Arts/Humanities</option><option>Vocational</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>12th percentage</label>
              <input type="number" value={form.twelfth_percentage} onChange={e => update('twelfth_percentage', e.target.value)} placeholder="e.g. 78.5" className={inputClass} disabled={isLocked} />
            </div>
            <div>
              <label className={labelClass}>Graduation subject / stream</label>
              <input type="text" value={form.graduation_subject} onChange={e => update('graduation_subject', e.target.value)} placeholder="e.g. B.Tech Computer Science, BA History" className={inputClass} disabled={isLocked} />
            </div>
            <div>
              <label className={labelClass}>Graduation year (or expected)</label>
              <input type="number" value={form.graduation_year} onChange={e => update('graduation_year', e.target.value)} placeholder="2023" className={inputClass} disabled={isLocked} />
            </div>
            <div>
              <label className={labelClass}>Graduation percentage / CGPA</label>
              <input type="number" value={form.graduation_percentage} onChange={e => update('graduation_percentage', e.target.value)} placeholder="e.g. 72.4 or 7.8 CGPA" className={inputClass} disabled={isLocked} />
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <input type="checkbox" checked={form.is_first_generation_aspirant} onChange={e => update('is_first_generation_aspirant', e.target.checked)} id="first_gen" className="w-4 h-4 accent-saffron" disabled={isLocked} />
              <label htmlFor="first_gen" className="text-white/70 text-sm">I am the first in my family to attempt a government exam</label>
            </div>
          </div>
        )}

        {/* Step 2 — Family */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Father's occupation</label>
              <input type="text" value={form.father_occupation} onChange={e => update('father_occupation', e.target.value)} placeholder="e.g. Farmer, Teacher, Private job" className={inputClass} disabled={isLocked} />
            </div>
            <div>
              <label className={labelClass}>Mother's occupation</label>
              <input type="text" value={form.mother_occupation} onChange={e => update('mother_occupation', e.target.value)} placeholder="e.g. Homemaker, Teacher" className={inputClass} disabled={isLocked} />
            </div>
            <div>
              <label className={labelClass}>Number of siblings</label>
              <input type="number" value={form.number_of_siblings} onChange={e => update('number_of_siblings', e.target.value)} placeholder="0, 1, 2..." className={inputClass} disabled={isLocked} />
            </div>
            <div>
              <label className={labelClass}>Your birth order</label>
              <select value={form.birth_order} onChange={e => update('birth_order', e.target.value)} className={selectClass} disabled={isLocked}>
                <option value="">Select</option>
                <option value="1">1st (Eldest)</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th or later</option>
                <option value="0">Only child</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Family type</label>
              <select value={form.family_type} onChange={e => update('family_type', e.target.value)} className={selectClass} disabled={isLocked}>
                <option value="">Select</option>
                <option>Nuclear family</option>
                <option>Joint family</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Financial dependents on you</label>
              <input type="number" value={form.financial_dependents} onChange={e => update('financial_dependents', e.target.value)} placeholder="0, 1, 2..." className={inputClass} />
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

        {/* Step 3 — Dream Job */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-saffron/5 border border-saffron/20 rounded-xl p-4 mb-2">
              <p className="text-saffron/80 text-xs leading-relaxed">Your dream job helps us build your rank progression. Even if you start with a different exam, we will always show you the path to your dream.</p>
            </div>
            <div>
              <label className={labelClass}>What is your dream government job?</label>
              <select
                value={form.dream_job}
                onChange={e => {
                  const selected = DREAM_JOBS.find(d => d.label === e.target.value)
                  update('dream_job', e.target.value)
                  if (selected) update('dream_job_track', selected.track)
                }}
                className={selectClass}
                disabled={isLocked}
              >
                <option value="">Select your dream</option>
                {DREAM_JOBS.map(d => <option key={d.label}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Career aspiration (in your own words)</label>
              <textarea
                value={form.career_aspiration}
                onChange={e => update('career_aspiration', e.target.value)}
                placeholder="e.g. I want to serve as a District Collector in my home state and work on rural development"
                rows={3}
                className={inputClass + " resize-none"}
                disabled={isLocked}
              />
            </div>
            <div>
              <label className={labelClass}>Minimum monthly salary target (Rs)</label>
              <select value={form.salary_target} onChange={e => update('salary_target', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                <option value="20000">Rs 20,000+</option>
                <option value="30000">Rs 30,000+</option>
                <option value="40000">Rs 40,000+</option>
                <option value="50000">Rs 50,000+</option>
                <option value="75000">Rs 75,000+</option>
                <option value="100000">Rs 1,00,000+</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Risk tolerance</label>
              <select value={form.risk_tolerance} onChange={e => update('risk_tolerance', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                <option>Low — want a safe steady exam</option>
                <option>Medium — okay with moderate competition</option>
                <option>High — willing to attempt tough exams</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4 — UPSC Optional (conditional) */}
        {step === 4 && showUPSCOptional && (
          <div className="space-y-4">
            <div className="bg-saffron/5 border border-saffron/20 rounded-xl p-4 mb-2">
              <p className="text-saffron/80 text-xs leading-relaxed">Your optional subject determines your entire preparation strategy. We will recommend backup exams that maximise overlap with your optional — so you never study something twice unnecessarily.</p>
            </div>
            <div>
              <label className={labelClass}>UPSC optional subject</label>
              <select
                value={form.upsc_optional_subject}
                onChange={e => {
                  const opt = UPSC_OPTIONALS.find(o => o.subject === e.target.value)
                  update('upsc_optional_subject', e.target.value)
                  if (opt) update('upsc_optional_category', opt.category)
                }}
                className={selectClass}
                disabled={isLocked}
              >
                <option value="">Select optional subject</option>
                {UPSC_OPTIONALS.map(o => <option key={o.subject}>{o.subject}</option>)}
              </select>
            </div>
            {form.upsc_optional_subject && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-white/40 text-xs mb-1">Optional category</p>
                <p className="text-white/70 text-sm capitalize">{form.upsc_optional_category}</p>
                <p className="text-white/40 text-xs mt-2">We will find exams that overlap with {form.upsc_optional_category} knowledge areas to minimise your preparation burden.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4 or 5 — Situation */}
        {((step === 4 && !showUPSCOptional) || (step === 5 && showUPSCOptional)) && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Current employment status</label>
              <select value={form.employment_status} onChange={e => update('employment_status', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                <option>Unemployed — preparing full time</option>
                <option>Working — preparing alongside job</option>
                <option>Student — final year</option>
                <option>Student — not final year</option>
                <option>Running own business</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Monthly household income (Rs)</label>
              <input type="number" value={form.monthly_income} onChange={e => update('monthly_income', e.target.value)} placeholder="25000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>This is your attempt number</label>
              <select value={form.current_attempt_number} onChange={e => update('current_attempt_number', e.target.value)} className={selectClass}>
                <option value="1">First attempt</option>
                <option value="2">Second attempt</option>
                <option value="3">Third attempt</option>
                <option value="4">Fourth attempt or more</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Are you taking coaching?</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => update('has_coaching', true)} className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${form.has_coaching ? 'bg-teal/20 border-teal text-white' : 'bg-white/5 border-white/10 text-white/60'}`}>Yes</button>
                <button type="button" onClick={() => { update('has_coaching', false); update('coaching_type', '') }} className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${!form.has_coaching ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/60'}`}>No</button>
              </div>
            </div>
            {form.has_coaching && (
              <div>
                <label className={labelClass}>Type of coaching</label>
                <select value={form.coaching_type} onChange={e => update('coaching_type', e.target.value)} className={selectClass}>
                  <option value="">Select</option>
                  <option>Offline classroom coaching</option>
                  <option>Online live classes</option>
                  <option>Recorded video course</option>
                  <option>Test series only</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Last Step — Preparation */}
        {((step === 5 && !showUPSCOptional) || (step === 6 && showUPSCOptional)) && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Study hours available per day</label>
              <select value={form.study_hours_per_day} onChange={e => update('study_hours_per_day', e.target.value)} className={selectClass}>
                <option value="">Select</option>
                <option value="1">1 hour</option><option value="2">2 hours</option>
                <option value="3">3 hours</option><option value="4">4 hours</option>
                <option value="5">5 hours</option><option value="6">6 hours</option>
                <option value="8">8 hours</option><option value="10">10+ hours</option>
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
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-10">
          {step > 0 && (
            <button
              type="button"
              onClick={prevStep}
              disabled={saving}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 text-sm font-medium hover:border-white/30 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          )}
          {step < totalSteps - 1 && (
            <button
              type="button"
              onClick={nextStep}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-saffron text-white text-sm font-semibold hover:bg-saffron/90 transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          )}
          {step === totalSteps - 1 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-saffron text-white text-sm font-semibold hover:bg-saffron/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : existingProfile?.onboarding_complete ? 'Save changes' : 'Complete profile'}
            </button>
          )}
        </div>

      </div>
    </main>
  )
}
