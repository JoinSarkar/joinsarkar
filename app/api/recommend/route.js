import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function getClaudeRecommendations(profile) {
  const prompt = `You are an expert advisor for Indian government job (sarkari naukri) aspirants. Based on the following profile, recommend exactly 3 compatible exams.

PROFILE:
- Age: ${profile.age}
- Education: ${profile.education_level} in ${profile.graduation_subject} (${profile.graduation_year})
- Home State: ${profile.home_state}
- Preferred Language: ${profile.preferred_language}
- Employment Status: ${profile.employment_status}
- Monthly Income: Rs ${profile.monthly_income}
- Financial Dependents: ${profile.financial_dependents}
- Study Hours Per Day: ${profile.study_hours_per_day}
- Preparation Started: ${profile.preparation_start}
- Relocation Willingness: ${profile.relocation_willingness}
- Salary Target: Rs ${profile.salary_target}/month
- Career Aspiration: ${profile.career_aspiration}
- Risk Tolerance: ${profile.risk_tolerance}
- Family Responsibilities: ${profile.family_responsibilities}

RULES:
1. Recommend exactly 3 exams
2. Never mix UPSC cluster with SSC or Banking cluster unless aspirant specifically wants civil services
3. Choose exams compatible in terms of syllabus overlap
4. Consider age limits, educational qualifications, and state eligibility
5. Factor in study hours available
6. Respond ONLY with a valid JSON array, no other text, no markdown, no explanation

Respond with this exact JSON structure:
[
  {
    "exam_name": "SSC CGL",
    "exam_cluster": "SSC",
    "fit_score": 87,
    "time_to_result": "12-18 months",
    "competition_level": "High",
    "salary_range": "Rs 35,000 to Rs 1,20,000/month",
    "career_outcome": "Group B and C posts in central government ministries",
    "why_this_exam": "Personalised explanation of why this exam fits this specific profile"
  },
  {
    "exam_name": "IBPS PO",
    "exam_cluster": "Banking",
    "fit_score": 78,
    "time_to_result": "8-12 months",
    "competition_level": "High",
    "salary_range": "Rs 52,000 to Rs 85,000/month",
    "career_outcome": "Probationary Officer in nationalised banks",
    "why_this_exam": "Personalised explanation"
  },
  {
    "exam_name": "SSC CHSL",
    "exam_cluster": "SSC",
    "fit_score": 72,
    "time_to_result": "10-14 months",
    "competition_level": "Medium-High",
    "salary_range": "Rs 25,000 to Rs 81,000/month",
    "career_outcome": "LDC and JSA posts in central government",
    "why_this_exam": "Personalised explanation"
  }
]`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].text
  console.log('Claude raw response:', text)

  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch (e) {
    console.error('JSON parse failed:', clean)
    throw new Error('Claude returned invalid JSON')
  }

  if (!Array.isArray(parsed)) {
    console.error('Response is not an array:', parsed)
    throw new Error('Claude response is not an array')
  }

  return parsed
}

export async function POST(request) {
  try {
    const { profile } = await request.json()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      )
    }

    const recommendations = await getClaudeRecommendations(profile)
    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Recommendation error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
