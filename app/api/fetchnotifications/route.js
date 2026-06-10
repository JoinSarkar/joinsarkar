export const maxDuration = 60

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request) {
  try {
    const { exams } = await request.json()

    if (!exams || exams.length === 0) {
      return NextResponse.json({ error: 'No exams provided' }, { status: 400 })
    }

    const examList = exams.join(', ')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Search for latest 2024-2025 notifications for ${examList} Indian government exams. Find application dates, exam dates, admit cards, results. Then return ONLY a JSON array like this, no other text:

[{"exam_name":"SSC CGL","notification_type":"application","title":"Title here","description":"Brief description","important_date":"2025-06-30","url":"https://ssc.nic.in"}]

notification_type must be one of: notification, application, admit_card, exam_date, result
important_date in YYYY-MM-DD format or null
Return 5-8 items maximum. ONLY the JSON array, nothing else.`
      }],
    })

    const fullText = message.content
      .map(item => item.type === 'text' ? item.text : '')
      .filter(Boolean)
      .join('\n')

    const startIndex = fullText.indexOf('[')
    const endIndex = fullText.lastIndexOf(']')

    if (startIndex === -1 || endIndex === -1) {
      return NextResponse.json({ error: 'No notifications found in search results' }, { status: 500 })
    }

    const jsonStr = fullText.substring(startIndex, endIndex + 1)
    let notifications

    try {
      notifications = JSON.parse(jsonStr)
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse notifications' }, { status: 500 })
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Fetch notifications error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
