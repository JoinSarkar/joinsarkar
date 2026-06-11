import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const { subject, examContext } = await request.json()
    if (!subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })

    const contextKey = (examContext || 'general').substring(0, 50)

    // Check cache first
    const { data: cached } = await supabase
      .from('quiz_cache')
      .select('questions, created_at')
      .eq('subject', subject)
      .eq('exam_context', contextKey)
      .single()

    // Use cache if it exists and is less than 24 hours old
    if (cached) {
      const age = Date.now() - new Date(cached.created_at).getTime()
      if (age < 24 * 60 * 60 * 1000) {
        console.log('Quiz served from cache:', subject)
        return NextResponse.json({ questions: cached.questions, fromCache: true })
      }
    }

    // Generate fresh quiz
    const prompt = `You are a quiz generator for Indian government job exam preparation.
Generate exactly 5 multiple choice questions on: ${subject}
Exam context: ${examContext || 'General government exam preparation'}

Rules:
1. Each question must be exam-relevant and factual
2. 4 options per question labeled A, B, C, D
3. One correct answer per question
4. Include a brief explanation for the correct answer
5. Difficulty should be moderate
6. Return ONLY valid JSON array, no markdown, no extra text

[
  {
    "question": "Question text here?",
    "options": { "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D" },
    "correct": "A",
    "explanation": "Brief explanation"
  }
]`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].text
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const startIndex = clean.indexOf('[')
    const endIndex = clean.lastIndexOf(']')
    const questions = JSON.parse(clean.substring(startIndex, endIndex + 1))

    if (!Array.isArray(questions)) throw new Error('Invalid quiz format')

    // Save to cache
    await supabase.from('quiz_cache').upsert({
      subject,
      exam_context: contextKey,
      questions,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ questions, fromCache: false })
  } catch (error) {
    console.error('Quiz error:', error.message)
    return NextResponse.json({ error: error.message || 'Failed to generate quiz' }, { status: 500 })
  }
}
