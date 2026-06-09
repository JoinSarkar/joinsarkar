import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request) {
  try {
    const { subject, examContext } = await request.json()

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    const prompt = `You are a quiz generator for Indian government job exam preparation.
Generate exactly 5 multiple choice questions on: ${subject}
Exam context: ${examContext || 'General government exam preparation'}

Rules:
1. Each question must be exam-relevant and factual
2. 4 options per question labeled A, B, C, D
3. One correct answer per question
4. Include a brief explanation for the correct answer
5. Difficulty should be moderate — similar to actual exam level
6. Return ONLY valid JSON, no markdown, no extra text

Return this exact JSON structure:
[
  {
    "question": "Question text here?",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "correct": "A",
    "explanation": "Brief explanation of why A is correct"
  }
]`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].text
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()

    let questions
    try {
      questions = JSON.parse(clean)
    } catch (e) {
      throw new Error('Failed to parse quiz questions')
    }

    if (!Array.isArray(questions)) {
      throw new Error('Invalid quiz format returned')
    }

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Quiz error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}
