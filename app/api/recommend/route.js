import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Hard-coded age limits — never let Claude guess these
const AGE_LIMITS = {
  'UPSC CSE': {
    General: { min: 21, max: 32 },
    OBC: { min: 21, max: 35 },
    SC: { min: 21, max: 37 },
    ST: { min: 21, max: 37 },
    EWS: { min: 21, max: 32 },
    attempts: { General: 6, OBC: 9, SC: 'unlimited', ST: 'unlimited', EWS: 6 }
  },
  'UPSC CAPF': {
    General: { min: 20, max: 25 },
    OBC: { min: 20, max: 28 },
    SC: { min: 20, max: 30 },
    ST: { min: 20, max: 30 },
    EWS: { min: 20, max: 25 },
  },
  'UPSC EPFO': {
    General: { min: 21, max: 30 },
    OBC: { min: 21, max: 33 },
    SC: { min: 21, max: 35 },
    ST: { min: 21, max: 35 },
    EWS: { min: 21, max: 30 },
  },
  'UPSC ESE': {
    General: { min: 21, max: 30 },
    OBC: { min: 21, max: 33 },
    SC: { min: 21, max: 35 },
    ST: { min: 21, max: 35 },
    EWS: { min: 21, max: 30 },
  },
  'SSC CGL': {
    General: { min: 18, max: 32 },
    OBC: { min: 18, max: 35 },
    SC: { min: 18, max: 37 },
    ST: { min: 18, max: 37 },
    EWS: { min: 18, max: 32 },
  },
  'SSC CHSL': {
    General: { min: 18, max: 27 },
    OBC: { min: 18, max: 30 },
    SC: { min: 18, max: 32 },
    ST: { min: 18, max: 32 },
    EWS: { min: 18, max: 27 },
  },
  'SSC CPO': {
    General: { min: 20, max: 25 },
    OBC: { min: 20, max: 28 },
    SC: { min: 20, max: 30 },
    ST: { min: 20, max: 30 },
    EWS: { min: 20, max: 25 },
  },
  'IBPS PO': {
    General: { min: 20, max: 30 },
    OBC: { min: 20, max: 33 },
    SC: { min: 20, max: 35 },
    ST: { min: 20, max: 35 },
    EWS: { min: 20, max: 30 },
  },
  'IBPS Clerk': {
    General: { min: 20, max: 28 },
    OBC: { min: 20, max: 31 },
    SC: { min: 20, max: 33 },
    ST: { min: 20, max: 33 },
    EWS: { min: 20, max: 28 },
  },
  'SBI PO': {
    General: { min: 21, max: 30 },
    OBC: { min: 21, max: 33 },
    SC: { min: 21, max: 35 },
    ST: { min: 21, max: 35 },
    EWS: { min: 21, max: 30 },
  },
  'RRB NTPC': {
    General: { min: 18, max: 33 },
    OBC: { min: 18, max: 36 },
    SC: { min: 18, max: 38 },
    ST: { min: 18, max: 38 },
    EWS: { min: 18, max: 33 },
  },
  'NDA': {
    General: { min: 16.5, max: 19.5 },
    OBC: { min: 16.5, max: 19.5 },
    SC: { min: 16.5, max: 19.5 },
    ST: { min: 16.5, max: 19.5 },
    EWS: { min: 16.5, max: 19.5 },
    note: 'Only unmarried male candidates. Female candidates eligible from 2023.'
  },
  'CDS': {
    General: { min: 19, max: 25 },
    OBC: { min: 19, max: 25 },
    SC: { min: 19, max: 25 },
    ST: { min: 19, max: 25 },
    EWS: { min: 19, max: 25 },
    note: 'No age relaxation for any category in CDS'
  },
  'State PCS': {
    General: { min: 21, max: 40 },
    OBC: { min: 21, max: 43 },
    SC: { min: 21, max: 45 },
    ST: { min: 21, max: 45 },
    EWS: { min: 21, max: 40 },
    note: 'Age limits vary by state. These are approximate. Always verify with official notification.'
  },
}

function checkEligibility(age, category, examName) {
  const limits = AGE_LIMITS[examName]
  if (!limits) return { eligible: true, note: 'Age limits not in database — verify with official notification' }
  const catLimits = limits[category] || limits['General']
  const eligible = age >= catLimits.min && age <= catLimits.max
  return {
    eligible,
    minAge: catLimits.min,
    maxAge: catLimits.max,
    note: limits.note || null,
    yearsLeft: catLimits.max - age,
  }
}

export async function POST(request) {
  try {
    const { profile, userId, forceRegenerate } = await request.json()
    if (!profile || !userId) return NextResponse.json({ error: 'Profile and userId required' }, { status: 400 })

    if (!forceRegenerate) {
      const { data: existing } = await supabase
        .from('exam_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
      if (existing && existing.length > 0) {
        return NextResponse.json({ recommendations: existing, fromCache: true })
      }
    }

    const age = profile.date_of_birth
      ? Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
      : null

    const category = profile.category || 'General'

    // Pre-check eligibility for common exams
    const eligibilityReport = age ? Object.keys(AGE_LIMITS).map(exam => {
      const check = checkEligibility(age, category, exam)
      return `${exam}: ${check.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE (age ' + age + ', limit ' + check.minAge + '-' + check.maxAge + ')'} ${check.yearsLeft && check.eligible ? '(' + check.yearsLeft + ' years remaining)' : ''} ${check.note ? '| Note: ' + check.note : ''}`
    }).join('\n') : 'Age not provided — cannot check eligibility'

    const isUPSCAspirant = profile.dream_job_track === 'civil_services' ||
      (profile.career_aspiration && (
        profile.career_aspiration.toLowerCase().includes('ias') ||
        profile.career_aspiration.toLowerCase().includes('upsc') ||
        profile.career_aspiration.toLowerCase().includes('civil service')
      ))

    const prompt = `You are an expert government exam counsellor for Indian aspirants.

ASPIRANT PROFILE:
- Name: ${profile.full_name}
- Age: ${age || 'Unknown'} years
- Category: ${category}
- Home state: ${profile.home_state}
- Education: ${profile.education_level} in ${profile.graduation_subject} (${profile.graduation_year}, ${profile.graduation_percentage}%)
- 12th stream: ${profile.twelfth_stream} (${profile.twelfth_percentage}%)
- First generation aspirant: ${profile.is_first_generation_aspirant ? 'Yes' : 'No'}
- Dream job: ${profile.dream_job}
- Career aspiration: ${profile.career_aspiration}
- UPSC Optional subject: ${profile.upsc_optional_subject || 'Not applicable'}
- Optional category: ${profile.upsc_optional_category || 'Not applicable'}
- Employment status: ${profile.employment_status}
- Monthly income: Rs ${profile.monthly_income}
- Study hours per day: ${profile.study_hours_per_day}
- Preparation started: ${profile.preparation_start}
- Current attempt: ${profile.current_attempt_number}
- Has coaching: ${profile.has_coaching ? profile.coaching_type : 'No'}
- Relocation: ${profile.relocation_willingness}
- Salary target: Rs ${profile.salary_target}/month
- Risk tolerance: ${profile.risk_tolerance}
- Family responsibilities: ${profile.family_responsibilities}
- Financial dependents: ${profile.financial_dependents}

VERIFIED AGE ELIGIBILITY FOR THIS CANDIDATE (${age} years, ${category} category):
${eligibilityReport}

CRITICAL RULES — YOU MUST FOLLOW THESE:
1. NEVER recommend an exam marked NOT ELIGIBLE above
2. Age limits above are ground truth — do not override or reinterpret them
3. If candidate has very few years left in an exam, flag it in why_this_exam
4. Education qualification rules:
   - UPSC CSE, State PCS: any graduate degree acceptable
   - UPSC ESE / IES: ONLY engineering graduates (B.Tech/BE) — DO NOT recommend to arts/commerce/science graduates
   - NDA: only for candidates aged 16.5-19.5, currently in 12th or just passed
   - CDS: graduate required, no age relaxation for any category
   - SSC CGL: any graduate
   - IBPS PO/Clerk: any graduate with min 60% for General (50% for reserved)
5. ${isUPSCAspirant && profile.upsc_optional_subject ? `OPTIONAL SUBJECT OVERLAP: Aspirant chose ${profile.upsc_optional_subject} (${profile.upsc_optional_category} category). Recommend backups with maximum overlap. DO NOT recommend IES/ESE unless optional is engineering-based.` : ''}
6. THREE EXAM RULE: Recommend EXACTLY 3 eligible exams
7. Portfolio compatibility: exams must share significant syllabus overlap
8. Consider graduation percentage: ${profile.graduation_percentage}% — some exams require minimum marks
9. Study hours: ${profile.study_hours_per_day} hrs/day — UPSC needs minimum 6 hrs, do not recommend if below 5 hrs without flagging
10. Financial situation: income Rs ${profile.monthly_income}, dependents ${profile.financial_dependents} — factor in time to result

EXAM PORTFOLIO RULES:
- UPSC cluster (compatible): UPSC CSE, State PCS, UPSC CAPF, UPSC EPFO, UPSC AC
- SSC cluster (compatible): SSC CGL, SSC CHSL, SSC CPO, RRB NTPC
- Banking cluster (compatible): IBPS PO, IBPS Clerk, SBI PO, RBI
- Defence cluster (compatible): CDS, AFCAT, NDA
- Never mix UPSC with Banking as primary track
- If financial pressure exists: include one fast-result exam (Banking or SSC)

Return ONLY a valid JSON array, no markdown, no extra text:
[
  {
    "exam_name": "UPSC CSE",
    "exam_cluster": "UPSC",
    "fit_score": 87,
    "time_to_result": "24-36 months",
    "competition_level": "Very High",
    "salary_range": "Rs 56,000 to Rs 2,50,000/month",
    "career_outcome": "IAS IPS IFS and other All India Services",
    "why_this_exam": "Personalised explanation referencing specific profile details including age eligibility status",
    "syllabus_overlap_percent": 100,
    "overlap_subjects": ["History", "Geography", "Polity", "Economy"],
    "is_dream_path": true,
    "bridge_xp_required": 0
  }
]`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].text
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const startIndex = clean.indexOf('[')
    const endIndex = clean.lastIndexOf(']')
    if (startIndex === -1 || endIndex === -1) throw new Error('No JSON array found')

    let recommendations
    try {
      recommendations = JSON.parse(clean.substring(startIndex, endIndex + 1))
    } catch (e) {
      throw new Error('Failed to parse recommendations: ' + e.message)
    }

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      throw new Error('Invalid recommendations format')
    }

    // Final safety check — filter out any ineligible exams Claude still recommended
    if (age) {
      recommendations = recommendations.filter(rec => {
        const check = checkEligibility(age, category, rec.exam_name)
        if (!check.eligible && AGE_LIMITS[rec.exam_name]) {
          console.warn('Filtered out ineligible exam:', rec.exam_name, 'age:', age, 'category:', category)
          return false
        }
        return true
      })
    }

    if (recommendations.length === 0) {
      throw new Error('No eligible exams found after age verification. Profile may need review.')
    }

    return NextResponse.json({ recommendations, fromCache: false })
  } catch (error) {
    console.error('Recommendation error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
