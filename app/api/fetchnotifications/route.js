export const maxDuration = 60

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
    const { exams, userId } = await request.json()
    if (!exams || exams.length === 0) return NextResponse.json({ error: 'No exams provided' }, { status: 400 })

    // Check if auto-fetch was done in last 24 hours for this user
    if (userId) {
      const { data: recentFetch } = await supabase
        .from('exam_notifications')
        .select('last_auto_fetch')
        .eq('user_id', userId)
        .not('last_auto_fetch', 'is', null)
        .order('last_auto_fetch', { ascending: false })
        .limit(1)
        .single()

      if (recentFetch?.last_auto_fetch) {
        const age = Date.now() - new Date(recentFetch.last_auto_fetch).getTime()
        if (age < 24 * 60 * 60 * 1000) {
          return NextResponse.json({
            notifications: [],
            cached: true,
            message: 'Notifications were fetched recently. Next fetch available in ' + Math.ceil((24 * 60 * 60 * 1000 - age) / (60 * 60 * 1000)) + ' hours.'
          })
        }
      }
    }

    const examList = exams.join(', ')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Search for latest 2024-2025 notifications for ${examList} Indian government exams. Find application dates, exam dates, admit cards, results. Then return ONLY a JSON array, no other text:

[{"exam_name":"SSC CGL","notification_type":"application","title":"Title here","description":"Brief description","important_date":"2025-06-30","url":"https://ssc.nic.in"}]

notification_type must be one of: notification, application, admit_card, exam_date, result
important_date in YYYY-MM-DD format or null
Return 5-8 items maximum. ONLY the JSON array.`
      }],
    })

    const fullText = message.content
      .map(item => item.type === 'text' ? item.text : '')
      .filter(Boolean)
      .join('\n')

    const startIndex = fullText.indexOf('[')
    const endIndex = fullText.lastIndexOf(']')
    if (startIndex === -1 || endIndex === -1) throw new Error('No notifications found')

    const notifications = JSON.parse(fullText.substring(startIndex, endIndex + 1))
    if (!Array.isArray(notifications)) throw new Error('Invalid format')

    return NextResponse.json({ notifications, cached: false })
  } catch (error) {
    console.error('Fetch notifications error:', error.message)
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 })
  }
}
