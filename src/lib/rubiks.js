export function formatDateInput(date = new Date()) {
  return new Date(date).toISOString().split('T')[0]
}

export function parseTimeToSeconds(value) {
  if (value === null || value === undefined) return null

  const raw = String(value).trim()
  if (!raw) return null

  if (/^\d+:\d{1,2}(\.\d+)?$/.test(raw)) {
    const [minutesPart, secondsPart] = raw.split(':')
    const minutes = Number(minutesPart)
    const seconds = Number(secondsPart)

    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null
    return minutes * 60 + seconds
  }

  const numeric = Number(raw)
  if (Number.isNaN(numeric)) return null
  return numeric
}

export function normalizeStoredTime(value) {
  const seconds = parseTimeToSeconds(value)
  if (seconds === null) return ''
  return seconds.toFixed(2)
}

export function formatSolveTime(value) {
  const seconds = parseTimeToSeconds(value)
  if (seconds === null) return '—'

  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainder = seconds - minutes * 60
  return `${minutes}:${remainder.toFixed(2).padStart(5, '0')}`
}

export function compareGoalHit(value, goal) {
  const solveSeconds = parseTimeToSeconds(value)
  const goalSeconds = parseTimeToSeconds(goal)

  if (solveSeconds === null || goalSeconds === null) return false
  return solveSeconds <= goalSeconds
}

export function getActivityTypeLabel(templateType) {
  switch (templateType) {
    case 'scramble_timer':
      return 'Scramble + Timer'
    case 'ao5_timer':
      return 'Average of 5'
    case 'regular_timer':
    default:
      return 'Regular Timer'
  }
}

export function calculateAo5(solves) {
  if (!Array.isArray(solves) || solves.length !== 5) return null

  const numbers = solves
    .map((value) => parseTimeToSeconds(value))
    .filter((value) => value !== null)

  if (numbers.length !== 5) return null

  const sorted = [...numbers].sort((a, b) => a - b)
  const middleThree = sorted.slice(1, 4)
  const average = middleThree.reduce((sum, item) => sum + item, 0) / 3

  return Number(average.toFixed(2))
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)]
}

export function generateScramble(length = 20) {
  const faces = ['R', 'L', 'U', 'D', 'F', 'B']
  const suffixes = ['', "'", '2']
  const axisGroups = {
    R: 'x',
    L: 'x',
    U: 'y',
    D: 'y',
    F: 'z',
    B: 'z',
  }

  const moves = []

  while (moves.length < length) {
    const face = randomItem(faces)
    const previous = moves[moves.length - 1]
    const beforePrevious = moves[moves.length - 2]

    if (previous && previous.face === face) {
      continue
    }

    if (
      previous &&
      beforePrevious &&
      axisGroups[previous.face] === axisGroups[face] &&
      axisGroups[beforePrevious.face] === axisGroups[face] &&
      previous.face !== beforePrevious.face
    ) {
      continue
    }

    moves.push({
      face,
      suffix: randomItem(suffixes),
    })
  }

  return moves.map((move) => `${move.face}${move.suffix}`).join(' ')
}

export function generateScrambleBank(count = 100) {
  return Array.from({ length: count }, () => generateScramble())
}