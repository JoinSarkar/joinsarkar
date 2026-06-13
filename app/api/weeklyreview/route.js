import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { profile, stats, checkins, exams } = await request.json()

    const totalHours = checkins.reduce((sum, c) => sum + (c.study_hours_logged || 0), 0)
    const daysStudied = checkins.filter(c => c.checked_in).length
    const mockScores = checkins.filter(c => c.mock_attempted && c.mock_score).map(c => c.mock_score)
    const avgMock = mockScores.length > 0 ? Math.round(mockScores.reduce((a, b) => a + b, 0) / mockScores.length) : null
    const topicsRaw = checkins.flatMap(c => c.topics_covered || [])
    const uniqueTopics = [...new Set(topicsRaw)]
    const consistencyScore = Math.round((daysStudied / 7) * 100)
    const targetHours = (profile?.study_hours_per_day || 4) * 7
    const hoursPercent = Math.round((totalHours / targetHours) * 100)

    const prompt = `You are a personal study coach for Indian government job aspirants.
Generate a detailed weekly review for this aspirant.

WEEKLY DATA:
- Days studied: ${daysStudied} out of 7
- Total hours: ${totalHours.toFixed(1)} (target: ${targetHours} hours)
- Hours achievement: ${hoursPercent}%
- Consistency score: ${consistencyScore}%
- Mock tests attempted: ${mockScores.length}
- Average mock score: ${avgMock ? avgMock + '%' : 'No mocks this week'}
- Topics covered: ${uniqueTopics.join(', ') || 'Not logged'}
- Current streak: ${stats?.current_streak || 0} days
- Total hours to date: ${stats?.total_hours?.toFixed(0) || 0}
- Exams: ${exams?.map(e => e.exam_name).join(', ') || 'Not set'}

Write a personalised weekly review with:
1. An overall assessment (2 sentences) — honest, not generic
2. Top strength this week (1 sentence with specific data)
3. Top area to improve (1 sentence with specific action)
4. Next week's focus (2-3 specific things to do differently)
5. One motivational closing line based on their actual progress

Return ONLY valid JSON:
{
  "overall": "Overall assessment here",
  "strength": "Top strength with specific data",
  "improvement": "Specific improvement with action",
  "next_week": ["Focus 1", "Focus 2", "Focus 3"],
  "motivation": "Closing motivational line"
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].text
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const startIndex = clean.indexOf('{')
    const endIndex = clean.lastIndexOf('}')
    const review = JSON.parse(clean.substring(startIndex, endIndex + 1))

    return NextResponse.json({
      review,
      stats: {
        totalHours: parseFloat(totalHours.toFixed(1)),
        targetHours,
        daysStudied,
        consistencyScore,
        mockScores,
        avgMock,
        uniqueTopics,
        hoursPercent,
      }
    })
  } catch (error) {
    console.error('Weekly review error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
