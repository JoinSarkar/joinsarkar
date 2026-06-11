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
    const { examContext } = await request.json()
    const today = new Date().toISOString().split('T')[0]

    // Check admin-posted current affairs first
    const { data: adminItems } = await supabase
      .from('admin_current_affairs')
      .select('*')
      .eq('is_published', true)
      .eq('publish_date', today)
      .order('created_at', { ascending: false })

    if (adminItems && adminItems.length > 0) {
      console.log('Current affairs served from admin content')
      const items = adminItems.map(item => ({
        headline: item.title,
        summary: item.summary,
        category: item.category,
        exam_relevance: item.exam_relevance || '',
        mcq: item.mcq || null,
      }))
      return NextResponse.json({ items, source: 'admin' })
    }

    // No admin content — use AI generation (once per day cached in current_affairs table)
    // The caching is handled by the frontend — this just generates fresh content
    const todayFormatted = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    const searchMessage = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Search for the most important Indian news from today or this week relevant for government exam preparation (SSC, UPSC, Banking, Railways). Find 8 important news items.`
      }],
    })

    const searchResults = searchMessage.content
      .map(item => item.type === 'text' ? item.text : '')
      .filter(Boolean)
      .join('\n')

    const structureMessage = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Based on these search results, generate 8 current affairs for Indian government exam preparation (${examContext || 'SSC, Banking, UPSC'}).

Search results:
${searchResults.substring(0, 2000)}

Today is ${todayFormatted}.
Return ONLY a valid JSON array. No markdown. No text before or after.

[{"headline":"Short headline","summary":"2-3 sentence summary","category":"Government","exam_relevance":"One sentence","mcq":{"question":"MCQ question","options":{"A":"A","B":"B","C":"C","D":"D"},"correct":"A","explanation":"Brief explanation"}}]

Category must be one of: Government, Economy, International, Science, Sports, Awards, Legal, Defence`
      }],
    })

    const text = structureMessage.content[0].text
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const startIndex = clean.indexOf('[')
    const endIndex = clean.lastIndexOf(']')

    if (startIndex === -1 || endIndex === -1) throw new Error('No JSON array found')

    const items = JSON.parse(clean.substring(startIndex, endIndex + 1))
    if (!Array.isArray(items) || items.length === 0) throw new Error('Invalid format')

    return NextResponse.json({ items, source: 'ai' })
  } catch (error) {
    console.error('Current affairs error:', error.message)
    return NextResponse.json({ error: error.message || 'Failed to generate current affairs' }, { status: 500 })
  }
}
