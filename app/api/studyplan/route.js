import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const SYLLABUS = {
  'UPSC CSE': { prelims: ['History', 'Geography', 'Polity', 'Economy', 'Environment', 'Science and Technology', 'Current Affairs', 'CSAT'], mains_gs: ['GS1 - History Culture Society', 'GS2 - Polity Governance IR', 'GS3 - Economy Environment Technology', 'GS4 - Ethics'], estimated_months: 18 },
  'State PCS': { prelims: ['History', 'Geography', 'Polity', 'Economy', 'Current Affairs', 'State Specific GK', 'CSAT'], mains: ['GS Papers', 'State Specific Topics', 'Essay', 'Optional Subject'], estimated_months: 12 },
  'UPSC CAPF': { papers: ['General Ability and Intelligence', 'General Studies Essay Comprehension'], estimated_months: 8 },
  'UPSC EPFO': { papers: ['General English', 'General Studies', 'Quantitative Aptitude', 'Industrial Relations Labour Laws'], estimated_months: 6 },
  'SSC CGL': { tiers: ['Tier1 - QA English Reasoning GK', 'Tier2 - QA English Statistics'], subjects: ['Quantitative Aptitude', 'English Language', 'General Intelligence and Reasoning', 'General Awareness'], estimated_months: 8 },
  'SSC CHSL': { subjects: ['Quantitative Aptitude', 'English Language', 'General Intelligence', 'General Awareness'], estimated_months: 6 },
  'IBPS PO': { subjects: ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'General Awareness and Banking', 'Computer Awareness'], estimated_months: 6 },
  'IBPS Clerk': { subjects: ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'General Awareness', 'Computer Awareness'], estimated_months: 5 },
  'SBI PO': { subjects: ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'General Awareness and Banking'], estimated_months: 6 },
  'RRB NTPC': { subjects: ['Mathematics', 'General Intelligence and Reasoning', 'General Awareness', 'General Science'], estimated_months: 6 },
}

function getSyllabus(examName) {
  for (const [key, value] of Object.entries(SYLLABUS)) {
    if (examName.includes(key) || key.includes(examName)) return { exam: key, ...value }
  }
  return null
}

function getOverlapSubjects(exams) {
  const allSubjects = exams.map(e => {
    const s = getSyllabus(e)
    if (!s) return []
    return [...(s.prelims || []), ...(s.subjects || []), ...(s.papers || []), ...(s.tiers || [])]
  })
  if (allSubjects.length === 0) return []
  const first = allSubjects[0]
  return first.filter(subject =>
    allSubjects.every(examSubjects =>
      examSubjects.some(es => es.toLowerCase().includes(subject.toLowerCase().split(' ')[0]))
    )
  )
}

export async function POST(request) {
  try {
    const { exams, profile } = await request.json()
    if (!exams || !profile) return NextResponse.json({ error: 'Exams and profile required' }, { status: 400 })

    const hoursPerDay = parseFloat(profile.study_hours_per_day) || 4
    const sessionsPerDay = hoursPerDay <= 3 ? 1 : hoursPerDay <= 6 ? 2 : 3
    const hoursPerSession = (hoursPerDay / sessionsPerDay).toFixed(1)

    const syllabusData = exams.map(e => ({ exam: e, syllabus: getSyllabus(e) }))
    const overlapSubjects = getOverlapSubjects(exams)
    const primaryExam = exams[0]
    const primarySyllabus = getSyllabus(primaryExam)
    const isUPSC = exams.some(e => e.includes('UPSC') || e.includes('State PCS') || e.includes('IAS'))

    const prompt = `You are a scientific study planner for Indian government exam aspirants with deep knowledge of all exam syllabi.

CANDIDATE PROFILE:
- Education: ${profile.education_level} in ${profile.graduation_subject}
- Study hours per day: ${hoursPerDay} (${sessionsPerDay} sessions of ${hoursPerSession} hours each)
- Preparation started: ${profile.preparation_start}
- Current attempt: ${profile.current_attempt_number}
- Has coaching: ${profile.has_coaching ? profile.coaching_type : 'Self study'}
- Optional subject (if UPSC): ${profile.upsc_optional_subject || 'Not applicable'}

EXAM PORTFOLIO:
${exams.map((e, i) => (i + 1) + '. ' + e + ' (' + (i === 0 ? 'PRIMARY' : 'BACKUP') + ')').join('\n')}

VERIFIED SYLLABUS DATA:
${syllabusData.map(s => s.exam + ': ' + JSON.stringify(s.syllabus)).join('\n')}

SHARED TOPICS ACROSS ALL EXAMS (study once, applies to all):
${overlapSubjects.join(', ') || 'Calculate from syllabus data above'}

SCIENTIFIC PLAN REQUIREMENTS:
1. Cover the COMPLETE syllabus of the primary exam (${primaryExam}) systematically
2. Shared topics must be studied ONCE and applied to all exams - never repeat
3. Exam-specific topics for backup exams get dedicated but shorter time
4. Follow this proven preparation sequence:
   - Phase 1 (Foundation): NCERT and basic concepts for all subjects
   - Phase 2 (Standard): Standard reference books and topic depth
   - Phase 3 (Revision): First revision of all topics
   - Phase 4 (Practice): Mock tests, PYQs, answer writing
   - Phase 5 (Final): Last revision, current affairs consolidation
5. ${isUPSC ? 'UPSC specific: Optional subject (' + (profile.upsc_optional_subject || 'TBD') + ') gets dedicated daily slot. GS preparation shared with State PCS backup.' : ''}
6. Sunday is ALWAYS mock test and weekly revision day
7. Current affairs: 30 minutes daily minimum for all exams
8. Sessions per day: ${sessionsPerDay} sessions of ${hoursPerSession} hours each
9. The plan must be realistic for someone with ${profile.preparation_start} of preparation
10. Do NOT make the plan easy or comfortable - it should be rigorous and cover everything needed to actually clear the exam

CRITICAL: This plan cannot be regenerated by the user. It must be comprehensive enough to take them from their current level to clearing the exam.

Keep each activity description under 25 words to ensure the full week fits. Return ONLY valid JSON, no markdown, no extra text:
{
  "exams": ${JSON.stringify(exams)},
  "primary_exam": "${primaryExam}",
  "hours_per_day": ${hoursPerDay},
  "total_preparation_months": ${primarySyllabus?.estimated_months || 12},
  "phases": [
    {"phase": 1, "name": "Foundation", "duration_weeks": 8, "focus": "What to cover in this phase", "key_resources": ["Resource 1", "Resource 2"]}
  ],
  "tip": "One specific, non-generic tip based on their exam combination",
  "subjects_covered": ["Subject 1", "Subject 2"],
  "shared_subjects": ["Subjects studied once for all exams"],
  "daily_routine": {
    "morning": "Specific morning session content",
    "afternoon": ${sessionsPerDay >= 2 ? '"Specific afternoon session content"' : 'null'},
    "evening": ${sessionsPerDay >= 3 ? '"Specific evening session content"' : '"30 min current affairs and revision"'},
    "night": "Review and next day preparation"
  },
  "weekly_plan": [
    {"day": "Monday", "type": "study", "sessions": [{"title": "Session 1", "duration": "${hoursPerSession} hours", "subject": "Subject name", "activity": "Specific task in under 25 words", "exam_relevance": "Which exam this covers"}]},
    {"day": "Tuesday", "type": "study", "sessions": [{"title": "Session 1", "duration": "${hoursPerSession} hours", "subject": "Subject name", "activity": "Specific task", "exam_relevance": "Which exam this covers"}]},
    {"day": "Wednesday", "type": "study", "sessions": [{"title": "Session 1", "duration": "${hoursPerSession} hours", "subject": "Subject name", "activity": "Specific task", "exam_relevance": "Which exam this covers"}]},
    {"day": "Thursday", "type": "study", "sessions": [{"title": "Session 1", "duration": "${hoursPerSession} hours", "subject": "Subject name", "activity": "Specific task", "exam_relevance": "Which exam this covers"}]},
    {"day": "Friday", "type": "study", "sessions": [{"title": "Session 1", "duration": "${hoursPerSession} hours", "subject": "Subject name", "activity": "Specific task", "exam_relevance": "Which exam this covers"}]},
    {"day": "Saturday", "type": "study", "sessions": [{"title": "Session 1", "duration": "${hoursPerSession} hours", "subject": "Subject name", "activity": "Specific task", "exam_relevance": "Which exam this covers"}]},
    {"day": "Sunday", "type": "revision", "sessions": [{"title": "Weekly Mock and Revision", "duration": "${hoursPerDay} hours", "subject": "Full Mock Test and Revision", "activity": "Attempt one full mock test for primary exam. Analyse errors. Revise weak topics identified this week.", "exam_relevance": "All exams"}]}
  ],
  "monthly_milestones": [
    { "week": 1, "goal": "Specific goal with subject names" },
    { "week": 2, "goal": "Specific goal" },
    { "week": 3, "goal": "Specific goal" },
    { "week": 4, "goal": "Specific goal with mock test target" }
  ]
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].text
    console.log('Study plan response length:', text.length)

    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const startIndex = clean.indexOf('{')
    const endIndex = clean.lastIndexOf('}')
    if (startIndex === -1 || endIndex === -1) throw new Error('No JSON found in response')

    let jsonStr = clean.substring(startIndex, endIndex + 1)

    let plan
    try {
      plan = JSON.parse(jsonStr)
    } catch (e) {
      console.error('Initial parse error:', e.message)
      // Attempt repair: remove control characters and fix common issues
      let repaired = jsonStr
        .replace(/[\u0000-\u001F]+/g, ' ')
        .replace(/,(\s*[}\]])/g, '$1')
      try {
        plan = JSON.parse(repaired)
        console.log('Repaired JSON successfully')
      } catch (e2) {
        console.error('Repair also failed:', e2.message)
        console.error('JSON snippet around error:', jsonStr.substring(12800, 13100))
        throw new Error('Failed to parse study plan: ' + e2.message)
      }
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Study plan error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
