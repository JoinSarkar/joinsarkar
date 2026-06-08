import { NextResponse } from 'next/server'

function generateMockStudyPlan(exams, hoursPerDay) {
  const subjects = {
    SSC: [
      'Quantitative Aptitude',
      'English Language',
      'General Intelligence & Reasoning',
      'General Awareness',
    ],
    Banking: [
      'Quantitative Aptitude',
      'Reasoning Ability',
      'English Language',
      'General Awareness & Banking',
      'Computer Awareness',
    ],
    UPSC: [
      'History & Culture',
      'Geography',
      'Polity & Governance',
      'Economy',
      'Science & Technology',
      'Current Affairs',
      'Essay & Answer Writing',
    ],
    Railways: [
      'Mathematics',
      'General Intelligence & Reasoning',
      'General Awareness',
      'General Science',
    ],
  }

  const clusters = exams.map(e => {
    if (e.includes('SSC')) return 'SSC'
    if (e.includes('IBPS') || e.includes('SBI') || e.includes('RBI')) return 'Banking'
    if (e.includes('UPSC') || e.includes('IAS')) return 'UPSC'
    if (e.includes('RRB') || e.includes('Railways')) return 'Railways'
    return 'SSC'
  })

  const uniqueClusters = [...new Set(clusters)]
  const allSubjects = [...new Set(uniqueClusters.flatMap(c => subjects[c] || subjects['SSC']))]

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const sessionsPerDay = hoursPerDay <= 3 ? 1 : hoursPerDay <= 6 ? 2 : 3
  const hoursPerSession = (hoursPerDay / sessionsPerDay).toFixed(1)

  const weeklyPlan = days.map((day, index) => {
    if (day === 'Sunday') {
      return {
        day,
        type: 'revision',
        sessions: [
          {
            title: 'Weekly Revision',
            duration: `${hoursPerDay} hours`,
            activity: 'Revise all topics covered this week. Attempt 1 mock test section.',
            subject: 'Full Revision',
          },
        ],
      }
    }

    const sessions = Array.from({ length: sessionsPerDay }, (_, i) => {
      const subjectIndex = (index * sessionsPerDay + i) % allSubjects.length
      const subject = allSubjects[subjectIndex]
      return {
        title: `Session ${i + 1}`,
        duration: `${hoursPerSession} hours`,
        subject,
        activity: getActivity(subject, i),
      }
    })

    return { day, type: 'study', sessions }
  })

  const monthlyMilestones = [
    { week: 1, goal: 'Complete foundation topics in all subjects. Attempt first diagnostic mock.' },
    { week: 2, goal: 'Cover quantitative and reasoning core chapters. Review weak areas from mock.' },
    { week: 3, goal: 'Focus on general awareness and current affairs. Attempt second mock.' },
    { week: 4, goal: 'Full revision week. Attempt full mock test and analyse performance.' },
  ]

  const dailyRoutine = {
    morning: hoursPerDay >= 6 ? 'Study Session 1 — High focus subjects (Maths, Reasoning)' : 'Study Session — Core subjects',
    afternoon: hoursPerDay >= 6 ? 'Study Session 2 — Language and General Awareness' : null,
    evening: hoursPerDay >= 8 ? 'Study Session 3 — Current Affairs and Revision' : 'Revision and Current Affairs (30 mins)',
    night: 'Review the day. Mark difficult topics. Prepare for tomorrow.',
  }

  return {
    exams,
    hours_per_day: hoursPerDay,
    weekly_plan: weeklyPlan,
    monthly_milestones: monthlyMilestones,
    daily_routine: dailyRoutine,
    subjects_covered: allSubjects,
    tip: 'Consistency beats intensity. Showing up every day for 3 hours beats 10-hour cramming sessions once a week.',
  }
}

function getActivity(subject, sessionIndex) {
  const activities = {
    'Quantitative Aptitude': 'Solve 30 practice questions. Focus on speed and accuracy. Review wrong answers.',
    'English Language': 'Reading comprehension + grammar rules. Practice 20 sentence correction questions.',
    'General Intelligence & Reasoning': 'Solve puzzles, syllogisms, and series questions. Time yourself strictly.',
    'General Awareness': 'Read last 3 months current affairs. Make short notes for quick revision.',
    'Reasoning Ability': 'Practice seating arrangement, blood relations, and coding-decoding.',
    'General Awareness & Banking': 'Cover banking terms, RBI policies, and recent financial news.',
    'Computer Awareness': 'Study MS Office, internet basics, and computer fundamentals.',
    'History & Culture': 'Cover ancient, medieval, and modern Indian history. Make timeline notes.',
    'Geography': 'Physical and human geography. Practice map-based questions.',
    'Polity & Governance': 'Study constitution, fundamental rights, DPSP, and parliament.',
    'Economy': 'Cover basic economic concepts, budget, and Five Year Plans.',
    'Science & Technology': 'Focus on recent scientific developments and basic science concepts.',
    'Current Affairs': 'Read newspaper for 30 mins. Note important events, appointments, and awards.',
    'Essay & Answer Writing': 'Practice 1 essay or 2 answer writing questions. Focus on structure.',
    'Mathematics': 'Solve 25 questions covering arithmetic, algebra, and geometry.',
    'General Science': 'Cover physics, chemistry, and biology basics from NCERT.',
  }
  return activities[subject] || 'Study core concepts and solve 20 practice questions.'
}

export async function POST(request) {
  try {
    const { exams, hoursPerDay } = await request.json()

    if (!exams || !hoursPerDay) {
      return NextResponse.json(
        { error: 'Exams and study hours are required' },
        { status: 400 }
      )
    }

    // TODO: Replace with Claude API call when key is available
    const plan = generateMockStudyPlan(exams, parseFloat(hoursPerDay))

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Study plan error:', error)
    return NextResponse.json(
      { error: 'Failed to generate study plan' },
      { status: 500 }
    )
  }
}
