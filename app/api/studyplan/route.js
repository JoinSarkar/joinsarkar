import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function getClaudeStudyPlan(exams, hoursPerDay) {
  const sessionsPerDay = hoursPerDay <= 3 ? 1 : hoursPerDay <= 6 ? 2 : 3
  const hoursPerSession = (hoursPerDay / sessionsPerDay).toFixed(1)

  const prompt = `You are a study planner for Indian government job aspirants.
Create a weekly study plan for: ${exams.join(', ')}
Study hours per day: ${hoursPerDay}
Sessions per day: ${sessionsPerDay} sessions of ${hoursPerSession} hours each

Return ONLY a JSON object. No markdown. No explanation. No extra text.
Use only straight double quotes. No apostrophes in text.

{
  "exams": ${JSON.stringify(exams)},
  "hours_per_day": ${hoursPerDay},
  "tip": "one short motivational tip here",
  "subjects_covered": ["Subject 1", "Subject 2", "Subject 3"],
  "daily_routine": {
    "morning": "morning study activity",
    "afternoon": ${sessionsPerDay >= 2 ? '"afternoon study activity"' : 'null'},
    "evening": "evening revision activity",
    "night": "night wind-down routine"
  },
  "weekly_plan": [
    {
      "day": "Monday",
      "type": "study",
      "sessions": [
        {
          "title": "Session 1",
          "duration": "${hoursPerSession} hours",
          "subject": "Subject name",
          "activity": "Specific task description"
        }
      ]
    },
    {
      "day": "Tuesday",
      "type": "study",
      "sessions": [
        {
          "title": "Session 1",
          "duration": "${hoursPerSession} hours",
          "subject": "Subject name",
          "activity": "Specific task description"
        }
      ]
    },
    {
      "day": "Wednesday",
      "type": "study",
      "sessions": [
        {
          "title": "Session 1",
          "duration": "${hoursPerSession} hours",
          "subject": "Subject name",
          "activity": "Specific task description"
        }
      ]
    },
    {
      "day": "Thursday",
      "type": "study",
      "sessions": [
        {
          "title": "Session 1",
          "duration": "${hoursPerSession} hours",
          "subject": "Subject name",
          "activity": "Specific task description"
        }
      ]
    },
    {
      "day": "Friday",
      "type": "study",
      "sessions": [
        {
          "title": "Session 1",
          "duration": "${hoursPerSession} hours",
          "subject": "Subject name",
          "activity": "Specific task description"
        }
      ]
    },
    {
      "day": "Saturday",
      "type": "study",
      "sessions": [
        {
          "title": "Session 1",
          "duration": "${hoursPerSession} hours",
          "subject": "Subject name",
          "activity": "Specific task description"
        }
      ]
    },
    {
      "day": "Sunday",
      "type": "revision",
      "sessions": [
        {
          "title": "Weekly Revision",
          "duration": "${hoursPerDay} hours",
          "subject": "Full Revision",
          "activity": "Revise all topics from this week and attempt one mock test"
        }
      ]
    }
  ],
  "monthly_milestones": [
    { "week": 1, "goal": "Week 1 goal here" },
    { "week": 2, "goal": "Week 2 goal here" },
    { "week": 3, "goal": "Week 3 goal here" },
    { "week": 4, "goal": "Week 4 goal here" }
  ]
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].text
  console.log('Claude study plan response length:', text.length)

  const clean = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch (e) {
    console.error('JSON parse failed at:', e.message)
    console.error('Raw response:', clean.substring(0, 500))
    throw new Error('Claude returned invalid JSON: ' + e.message)
  }

  return parsed
}

export async function POST(request) {
  try {
    const { exams, hoursPerDay } = await request.json()

    if (!exams || !hoursPerDay) {
      return NextResponse.json(
        { error: 'Exams and study hours are required' },
        { status: 400 }
      )
    }

    const plan = await getClaudeStudyPlan(exams, parseFloat(hoursPerDay))
    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Study plan error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate study plan' },
      { status: 500 }
    )
  }
}
