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

    // Check cache — notes are cached permanently (they don't change)
    const { data: cached } = await supabase
      .from('notes_cache')
      .select('notes')
      .eq('subject', subject)
      .eq('exam_context', contextKey)
      .single()

    if (cached) {
      console.log('Notes served from cache:', subject)
      return NextResponse.json({ notes: cached.notes, fromCache: true })
    }

    // Generate fresh notes
    const prompt = `You are a concise notes generator for Indian government job exam preparation.
Generate clear, exam-focused notes on: ${subject}
Exam context: ${examContext || 'General government exam preparation'}

Format:
- Start with a 2-line overview
- List 8-12 key points most likely to appear in exams
- Each point should be 1-2 lines max
- End with 3 important facts to remember
- Use simple language for quick revision
- No markdown headers or bullets — plain text with clear sections
- Keep total length under 400 words`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const notes = message.content[0].text

    // Save to cache permanently
    await supabase.from('notes_cache').upsert({
      subject,
      exam_context: contextKey,
      notes,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ notes, fromCache: false })
  } catch (error) {
    console.error('Notes error:', error.message)
    return NextResponse.json({ error: error.message || 'Failed to generate notes' }, { status: 500 })
  }
}
