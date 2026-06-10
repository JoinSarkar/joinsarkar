import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request) {
  try {
    const { question, answer, wordLimit, examType, mode } = await request.json()

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    if (mode === 'model_answer') {
      const prompt = `You are an expert UPSC/State PCS answer writing coach.
Write a model answer for the following question.

Question: ${question}
Word limit: ${wordLimit || 250} words
Exam type: ${examType || 'UPSC Mains'}

Write a complete model answer that:
1. Has a clear introduction that defines key terms
2. Has well-structured body paragraphs with headings if needed
3. Includes relevant examples, data, and case studies
4. Has a balanced perspective where needed
5. Ends with a strong conclusion
6. Stays within the word limit
7. Uses simple, clear language suitable for government exams

Write the model answer directly without any preamble.`

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      })

      return NextResponse.json({ modelAnswer: message.content[0].text })
    }

    if (mode === 'evaluate') {
      if (!answer) {
        return NextResponse.json({ error: 'Answer is required for evaluation' }, { status: 400 })
      }

      const prompt = `You are an expert UPSC/State PCS answer evaluator.
Evaluate the following answer strictly and constructively.

Question: ${question}
Word limit: ${wordLimit || 250} words
Exam type: ${examType || 'UPSC Mains'}
Student answer: ${answer}

Evaluate on these parameters and give a score for each out of 10:
1. Introduction quality (clear, relevant, defines key terms)
2. Content and coverage (facts, accuracy, depth)
3. Structure and flow (logical progression, headings, paragraphs)
4. Examples and evidence (relevant examples, data, case studies)
5. Conclusion (summarises well, forward looking)
6. Language and clarity (simple, clear, no repetition)
7. Word limit adherence (within 10 percent of limit)

Return ONLY valid JSON, no markdown:
{
  "total_score": 67,
  "max_score": 100,
  "grade": "B",
  "parameters": [
    { "name": "Introduction", "score": 8, "max": 10, "feedback": "Specific feedback here" },
    { "name": "Content", "score": 7, "max": 10, "feedback": "Specific feedback here" },
    { "name": "Structure", "score": 6, "max": 10, "feedback": "Specific feedback here" },
    { "name": "Examples", "score": 5, "max": 10, "feedback": "Specific feedback here" },
    { "name": "Conclusion", "score": 7, "max": 10, "feedback": "Specific feedback here" },
    { "name": "Language", "score": 8, "max": 10, "feedback": "Specific feedback here" },
    { "name": "Word limit", "score": 9, "max": 10, "feedback": "Specific feedback here" }
  ],
  "overall_feedback": "2-3 sentence overall assessment",
  "top_strength": "The best thing about this answer",
  "top_improvement": "The single most important thing to improve",
  "word_count": 230
}`

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = message.content[0].text
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()

      const startIndex = clean.indexOf('{')
      const endIndex = clean.lastIndexOf('}')
      const jsonStr = clean.substring(startIndex, endIndex + 1)

      let evaluation
      try {
        evaluation = JSON.parse(jsonStr)
      } catch (e) {
        throw new Error('Failed to parse evaluation')
      }

      return NextResponse.json({ evaluation })
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  } catch (error) {
    console.error('Answer writing error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to process answer' },
      { status: 500 }
    )
  }
}
