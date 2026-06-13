// XP and Rank Engine for Join Sarkar
// All gamification logic lives here

export const RANK_SYSTEMS = {
  'civil_services': {
    name: 'Civil Services',
    keywords: ['IAS', 'IPS', 'IFS', 'civil service', 'UPSC', 'collector', 'district'],
    ranks: [
      { level: 0, title: 'Aspirant', xp: 0 },
      { level: 1, title: 'Probationer', xp: 100 },
      { level: 2, title: 'SDM', xp: 250 },
      { level: 3, title: 'Deputy Collector', xp: 500 },
      { level: 4, title: 'District Magistrate', xp: 1000 },
      { level: 5, title: 'Superintendent of Police', xp: 2000 },
      { level: 6, title: 'Commissioner', xp: 3500 },
      { level: 7, title: 'IAS Officer', xp: 5000 },
    ]
  },
  'army': {
    name: 'Indian Army',
    keywords: ['army', 'CDS', 'NDA', 'defence', 'military', 'soldier'],
    ranks: [
      { level: 0, title: 'Aspirant', xp: 0 },
      { level: 1, title: 'Sepoy', xp: 100 },
      { level: 2, title: 'Lance Naik', xp: 250 },
      { level: 3, title: 'Naik', xp: 500 },
      { level: 4, title: 'Havildar', xp: 1000 },
      { level: 5, title: 'Subedar', xp: 2000 },
      { level: 6, title: 'Lieutenant', xp: 3500 },
      { level: 7, title: 'Captain', xp: 5000 },
    ]
  },
  'navy': {
    name: 'Indian Navy',
    keywords: ['navy', 'naval', 'sailor', 'maritime'],
    ranks: [
      { level: 0, title: 'Aspirant', xp: 0 },
      { level: 1, title: 'Sailor', xp: 100 },
      { level: 2, title: 'Leading Seaman', xp: 250 },
      { level: 3, title: 'Petty Officer', xp: 500 },
      { level: 4, title: 'Chief Petty Officer', xp: 1000 },
      { level: 5, title: 'Sub Lieutenant', xp: 2000 },
      { level: 6, title: 'Lieutenant Commander', xp: 3500 },
      { level: 7, title: 'Commander', xp: 5000 },
    ]
  },
  'airforce': {
    name: 'Indian Air Force',
    keywords: ['air force', 'IAF', 'pilot', 'airman', 'flying'],
    ranks: [
      { level: 0, title: 'Aspirant', xp: 0 },
      { level: 1, title: 'Airman', xp: 100 },
      { level: 2, title: 'Corporal', xp: 250 },
      { level: 3, title: 'Sergeant', xp: 500 },
      { level: 4, title: 'Warrant Officer', xp: 1000 },
      { level: 5, title: 'Flying Officer', xp: 2000 },
      { level: 6, title: 'Flight Lieutenant', xp: 3500 },
      { level: 7, title: 'Squadron Leader', xp: 5000 },
    ]
  },
  'banking': {
    name: 'Banking',
    keywords: ['bank', 'IBPS', 'SBI', 'RBI', 'finance', 'PO', 'clerk'],
    ranks: [
      { level: 0, title: 'Aspirant', xp: 0 },
      { level: 1, title: 'Banking Trainee', xp: 100 },
      { level: 2, title: 'Clerk', xp: 250 },
      { level: 3, title: 'Junior Officer', xp: 500 },
      { level: 4, title: 'Probationary Officer', xp: 1000 },
      { level: 5, title: 'Branch Manager', xp: 2000 },
      { level: 6, title: 'Senior Manager', xp: 3500 },
      { level: 7, title: 'General Manager', xp: 5000 },
    ]
  },
  'railways': {
    name: 'Indian Railways',
    keywords: ['railway', 'RRB', 'NTPC', 'station', 'loco'],
    ranks: [
      { level: 0, title: 'Aspirant', xp: 0 },
      { level: 1, title: 'Apprentice', xp: 100 },
      { level: 2, title: 'Junior Clerk', xp: 250 },
      { level: 3, title: 'Senior Clerk', xp: 500 },
      { level: 4, title: 'Station Master', xp: 1000 },
      { level: 5, title: 'Inspector', xp: 2000 },
      { level: 6, title: 'Senior Inspector', xp: 3500 },
      { level: 7, title: 'Gazetted Officer', xp: 5000 },
    ]
  },
  'ssc': {
    name: 'SSC / Central Govt',
    keywords: ['SSC', 'CGL', 'CHSL', 'MTS', 'central government', 'ministry'],
    ranks: [
      { level: 0, title: 'Aspirant', xp: 0 },
      { level: 1, title: 'Junior Assistant', xp: 100 },
      { level: 2, title: 'Assistant', xp: 250 },
      { level: 3, title: 'Senior Assistant', xp: 500 },
      { level: 4, title: 'Inspector', xp: 1000 },
      { level: 5, title: 'Senior Inspector', xp: 2000 },
      { level: 6, title: 'Gazetted Officer', xp: 3500 },
      { level: 7, title: 'Group A Officer', xp: 5000 },
    ]
  },
  'teaching': {
    name: 'Teaching',
    keywords: ['teaching', 'TET', 'CTET', 'teacher', 'education', 'school'],
    ranks: [
      { level: 0, title: 'Aspirant', xp: 0 },
      { level: 1, title: 'Trainee', xp: 100 },
      { level: 2, title: 'Junior Teacher', xp: 250 },
      { level: 3, title: 'Teacher', xp: 500 },
      { level: 4, title: 'Senior Teacher', xp: 1000 },
      { level: 5, title: 'Head Teacher', xp: 2000 },
      { level: 6, title: 'Lecturer', xp: 3500 },
      { level: 7, title: 'Principal', xp: 5000 },
    ]
  },
}

export const XP_REWARDS = {
  checkin: 10,
  study_hour: 10,
  quiz_complete: 15,
  quiz_perfect: 25,
  notes_read: 5,
  mock_complete: 25,
  mock_above_70: 40,
  seven_day_streak: 50,
  thirty_day_streak: 150,
  hundred_hours: 200,
}

export const MILESTONES = [
  { key: 'first_checkin', title: 'First Step', desc: 'Completed your first daily check-in', xp: 20 },
  { key: 'streak_3', title: '3-Day Streak', desc: 'Studied 3 days in a row', xp: 30 },
  { key: 'streak_7', title: 'Week Warrior', desc: 'Studied 7 days in a row', xp: 50 },
  { key: 'streak_30', title: 'Iron Discipline', desc: 'Studied 30 days in a row', xp: 150 },
  { key: 'hours_10', title: 'Getting Started', desc: 'Logged 10 hours of study', xp: 25 },
  { key: 'hours_50', title: 'Serious Aspirant', desc: 'Logged 50 hours of study', xp: 75 },
  { key: 'hours_100', title: 'Century', desc: 'Logged 100 hours of study', xp: 200 },
  { key: 'hours_500', title: 'Elite Aspirant', desc: 'Logged 500 hours of study', xp: 500 },
  { key: 'first_quiz', title: 'Quiz Taker', desc: 'Completed your first quiz', xp: 15 },
  { key: 'first_mock', title: 'Mock Master', desc: 'Attempted your first mock test', xp: 25 },
  { key: 'mock_70', title: 'Above Average', desc: 'Scored above 70% in a mock', xp: 40 },
  { key: 'first_rank_up', title: 'Promoted!', desc: 'Reached your first rank', xp: 30 },
  { key: 'rank_max', title: 'Dream Achieved', desc: 'Reached the highest rank', xp: 1000 },
]

export function getRankSystem(careerAspiration) {
  if (!careerAspiration) return RANK_SYSTEMS.ssc
  const lower = careerAspiration.toLowerCase()
  for (const [key, system] of Object.entries(RANK_SYSTEMS)) {
    if (system.keywords.some(k => lower.includes(k.toLowerCase()))) {
      return system
    }
  }
  return RANK_SYSTEMS.ssc
}

export function getCurrentRank(xp, rankSystem) {
  const ranks = [...rankSystem.ranks].reverse()
  return ranks.find(r => xp >= r.xp) || rankSystem.ranks[0]
}

export function getNextRank(xp, rankSystem) {
  return rankSystem.ranks.find(r => r.xp > xp) || null
}

export function getXPProgress(xp, rankSystem) {
  const current = getCurrentRank(xp, rankSystem)
  const next = getNextRank(xp, rankSystem)
  if (!next) return 100
  const range = next.xp - current.xp
  const progress = xp - current.xp
  return Math.round((progress / range) * 100)
}

export function calculateXPForCheckin(hoursStudied, mockAttempted, mockScore, streakDays) {
  let xp = XP_REWARDS.checkin
  xp += Math.floor(hoursStudied) * XP_REWARDS.study_hour
  if (mockAttempted) {
    xp += XP_REWARDS.mock_complete
    if (mockScore >= 70) xp += XP_REWARDS.mock_above_70 - XP_REWARDS.mock_complete
  }
  if (streakDays === 7) xp += XP_REWARDS.seven_day_streak
  if (streakDays === 30) xp += XP_REWARDS.thirty_day_streak
  return xp
}

export function checkMilestones(stats, previousStats) {
  const earned = []
  const totalHours = stats.total_hours || 0
  const streak = stats.current_streak || 0
  const totalCheckins = stats.total_days_studied || 0

  if (totalCheckins >= 1 && (previousStats?.total_days_studied || 0) < 1) earned.push('first_checkin')
  if (streak >= 3 && (previousStats?.current_streak || 0) < 3) earned.push('streak_3')
  if (streak >= 7 && (previousStats?.current_streak || 0) < 7) earned.push('streak_7')
  if (streak >= 30 && (previousStats?.current_streak || 0) < 30) earned.push('streak_30')
  if (totalHours >= 10 && (previousStats?.total_hours || 0) < 10) earned.push('hours_10')
  if (totalHours >= 50 && (previousStats?.total_hours || 0) < 50) earned.push('hours_50')
  if (totalHours >= 100 && (previousStats?.total_hours || 0) < 100) earned.push('hours_100')
  if (totalHours >= 500 && (previousStats?.total_hours || 0) < 500) earned.push('hours_500')

  return earned
}
