import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request) {
  try {
    const { examContext } = await request.json()

    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    // Step 1: Search for current affairs
    const searchMessage = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
        }
      ],
      messages: [{ 
        role: 'user', 
        content: `Search for the most important Indian news and current affairs from today or this week that are relevant for government exam preparation (SSC, UPSC, Banking, Railways). Find 8 important news items covering government schemes, economy, international relations, science, sports, awards, and defence.`
      }],
    })

    // Extract all text from search results
    const searchResults = searchMessage.content
      .map(item => {
        if (item.type === 'text') return item.text
        if (item.type === 'tool_result') return JSON.stringify(item)
        return ''
      })
      .filter(Boolean)
      .join('\n')

    // Step 2: Use search results to generate structured current affairs
    const structureMessage = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `Based on these recent news search results, generate 8 current affairs items for Indian government exam preparation (${examContext || 'SSC, Banking, UPSC'}).

Search results:
${searchResults.substring(0, 3000)}

Today is ${today}.

Return ONLY a valid JSON array. No markdown. No explanation. No text before or after the JSON.

[
  {
    "headline": "Short headline",
    "summary": "2-3 sentence summary of what happened and why it matters for exams",
    "category": "Government",
    "exam_relevance": "One sentence on which exams this relates to",
    "mcq": {
      "question": "MCQ question based on this news",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correct": "A",
      "explanation": "Brief explanation of correct answer"
    }
  }
]

Category must be one of: Government, Economy, International, Science, Sports, Awards, Legal, Defence`
        }
      ],
    })

    const text = structureMessage.content[0].text
    console.log('Current affairs raw length:', text.length)

    // Clean and parse
    const clean = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    // Find JSON array in response
    const startIndex = clean.indexOf('[')
    const endIndex = clean.lastIndexOf(']')
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('No JSON array found in response:', clean.substring(0, 200))
      throw new Error('No JSON array found in response')
    }

    const jsonStr = clean.substring(startIndex, endIndex + 1)

    let items
    try {
      items = JSON.parse(jsonStr)
    } catch (e) {
      console.error('Parse error:', e.message)
      console.error('JSON string start:', jsonStr.substring(0, 200))
      throw new Error('Failed to parse current affairs JSON')
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Invalid format returned')
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Current affairs error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate current affairs' },
      { status: 500 }
    )
  }
}
