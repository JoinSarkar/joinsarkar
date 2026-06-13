import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { profile, stats, exams, recentCheckins } = await request.json()

    const totalHours = stats?.total_hours || 0
    const streak = stats?.current_streak || 0
    const avgHours = recentCheckins?.length > 0
      ? (recentCheckins.reduce((sum, c) => sum + (c.study_hours_logged || 0), 0) / recentCheckins.length).toFixed(1)
      : 0

    const prompt = `You are an AI motivational coach for Indian government job aspirants.
Generate a personalised daily briefing for this aspirant.

PROFILE:
- Name: ${profile?.full_name || 'Aspirant'}
- Career goal: ${profile?.career_aspiration || 'Government job'}
- Study hours available: ${profile?.study_hours_per_day || 4} hours/day
- Exams: ${exams?.map(e => e.exam_name).join(', ') || 'Not set'}

CURRENT STATS:
- Total study hours: ${totalHours}
- Current streak: ${streak} days
- Average hours last 7 days: ${avgHours} hours/day
- Total days studied: ${stats?.total_days_studied || 0}

Generate a briefing with three parts:
1. A short punchy headline (max 10 words) that reflects their current progress
2. One evidence-based insight (2 sentences) using their actual data — never generic
3. Today's specific mission (1 sentence) — what exactly to focus on today

Return ONLY valid JSON:
{
  "headline": "Short punchy headline here",
  "insight": "Evidence-based insight using their real numbers",
  "mission": "Specific mission for today"
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].text
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const startIndex = clean.indexOf('{')
    const endIndex = clean.lastIndexOf('}')
    const briefing = JSON.parse(clean.substring(startIndex, endIndex + 1))

    return NextResponse.json({ briefing })
  } catch (error) {
    console.error('War room error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
