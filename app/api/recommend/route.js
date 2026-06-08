import { NextResponse } from 'next/server'

// ─────────────────────────────────────────
// MOCK ENGINE — replace with Claude API call
// when Anthropic key is available
// ─────────────────────────────────────────

function generateMockRecommendations(profile) {
  const allExams = [
    {
      exam_name: 'SSC CGL',
      exam_cluster: 'SSC',
      fit_score: 85,
      time_to_result: '12–18 months',
      competition_level: 'High',
      salary_range: '₹35,000 – ₹1,20,000/month',
      career_outcome: 'Group B & C posts in central government ministries',
      why_this_exam: 'SSC CGL is ideal for graduates seeking stable central government employment. With your educational background and study availability, you have a strong chance of clearing Tier 1 and Tier 2 within 12–18 months of focused preparation.',
    },
    {
      exam_name: 'IBPS PO',
      exam_cluster: 'Banking',
      fit_score: 78,
      time_to_result: '8–12 months',
      competition_level: 'High',
      salary_range: '₹52,000 – ₹85,000/month',
      career_outcome: 'Probationary Officer in nationalised banks across India',
      why_this_exam: 'Banking PO offers one of the fastest routes to a well-paying government job. The exam cycle is annual, the syllabus overlaps significantly with SSC, and the salary package at entry level is among the best in objective-exam government jobs.',
    },
    {
      exam_name: 'SSC CHSL',
      exam_cluster: 'SSC',
      fit_score: 72,
      time_to_result: '10–14 months',
      competition_level: 'Medium-High',
      salary_range: '₹25,000 – ₹81,000/month',
      career_outcome: 'LDC, JSA, PA/SA and DEO posts in central government',
      why_this_exam: 'SSC CHSL has a lower difficulty ceiling than CGL and shares 80% of the syllabus. Preparing for both simultaneously is highly efficient — CHSL acts as a safety net while you aim for CGL.',
    },
    {
      exam_name: 'UPSC CSE',
      exam_cluster: 'UPSC',
      fit_score: 65,
      time_to_result: '24–36 months',
      competition_level: 'Very High',
      salary_range: '₹56,000 – ₹2,50,000/month',
      career_outcome: 'IAS, IPS, IFS and 22 other All India Services',
      why_this_exam: 'UPSC CSE is the most prestigious government exam in India. It demands 2–3 years of dedicated preparation. Given your profile, this is a viable long-term goal if you are willing to commit fully.',
    },
    {
      exam_name: 'RRB NTPC',
      exam_cluster: 'Railways',
      fit_score: 70,
      time_to_result: '10–16 months',
      competition_level: 'High',
      salary_range: '₹35,000 – ₹92,000/month',
      career_outcome: 'Non-Technical Popular Category posts in Indian Railways',
      why_this_exam: 'Indian Railways is one of the largest employers in the world. RRB NTPC offers job security, good pay, and transfer benefits. The syllabus is similar to SSC making combined preparation efficient.',
    },
    {
      exam_name: 'IBPS Clerk',
      exam_cluster: 'Banking',
      fit_score: 74,
      time_to_result: '6–10 months',
      competition_level: 'Medium-High',
      salary_range: '₹29,000 – ₹51,000/month',
      career_outcome: 'Clerical cadre in nationalised banks with promotion path',
      why_this_exam: 'IBPS Clerk is one of the fastest routes into the banking sector. It shares its syllabus with IBPS PO, so preparing for both simultaneously is highly efficient. A good entry point with a clear promotion path to officer grade.',
    },
  ]

  // Score and sort based on profile
  let scored = allExams.map(exam => {
    let score = exam.fit_score

    // Boost banking exams if salary target is high
    if (profile.salary_target >= 50000 && exam.exam_cluster === 'Banking') {
      score += 5
    }

    // Boost UPSC if career aspiration is civil service
    if (
      profile.career_aspiration?.includes('civil service') &&
      exam.exam_cluster === 'UPSC'
    ) {
      score += 10
    }

    // Boost SSC if risk tolerance is low
    if (profile.risk_tolerance?.includes('Low') && exam.exam_cluster === 'SSC') {
      score += 5
    }

    // Reduce UPSC score if study hours are low
    if (profile.study_hours_per_day < 4 && exam.exam_name === 'UPSC CSE') {
      score -= 15
    }

    // Boost railways if relocation is open
    if (
      profile.relocation_willingness?.includes('anywhere') &&
      exam.exam_cluster === 'Railways'
    ) {
      score += 5
    }

    return { ...exam, fit_score: Math.min(score, 99) }
  })

  // Sort by fit score and return top 3
  scored.sort((a, b) => b.fit_score - a.fit_score)
  return scored.slice(0, 3)
}

// ─────────────────────────────────────────
// API ROUTE
// ─────────────────────────────────────────

export async function POST(request) {
  try {
    const { profile } = await request.json()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      )
    }

    // TODO: Replace this with Claude API call when key is available
    // const recommendations = await getClaudeRecommendations(profile)
    const recommendations = generateMockRecommendations(profile)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}