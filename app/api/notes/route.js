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

    const prompt = `You are a concise notes generator for Indian government job exam preparation.
Generate clear, exam-focused notes on: ${subject}
Exam context: ${examContext || 'General government exam preparation'}

Format the notes as follows:
- Start with a 2-line overview of the subject
- List 8-12 key points that are most likely to appear in exams
- Each point should be concise (1-2 lines max)
- End with 3 important facts to remember
- Use simple language suitable for quick revision
- Do NOT use markdown headers or bullets — write in plain text with clear sections
- Keep total length under 400 words`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const notes = message.content[0].text

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Notes error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate notes' },
      { status: 500 }
    )
  }
}
