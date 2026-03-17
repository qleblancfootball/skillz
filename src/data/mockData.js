export const categories = [
  {
    id: 'athletics',
    name: 'Athletics',
    image:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'mental',
    name: 'Mental',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
  },
]

export const skills = [
  {
    id: 'vertical',
    categoryId: 'athletics',
    name: 'Vertical',
    pb: '32',
    ranking: 'B+',
    unit: 'in',
    valueLabel: 'Jump Height',
    pbLabel: 'PB Vertical',
    higherIsBetter: true,
    image:
      'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
    notes: 'Working on approach jumps and consistency off two feet.',
    lastUpdated: '2026-03-17',
    progress: [
      { id: 1, date: '2026-03-17', value: '32', note: 'Best jump in a while.' },
      { id: 2, date: '2026-03-10', value: '31.5', note: 'Legs felt heavy.' },
    ],
  },
  {
    id: 'focus',
    categoryId: 'mental',
    name: 'Focus',
    pb: '45',
    ranking: 'B',
    unit: 'min',
    valueLabel: 'Deep Work Time',
    pbLabel: 'PB Focus Session',
    higherIsBetter: true,
    image:
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    notes: 'Need fewer distractions and cleaner sessions.',
    lastUpdated: '2026-03-15',
    progress: [
      { id: 1, date: '2026-03-15', value: '45', note: 'Solid session.' },
      { id: 2, date: '2026-03-08', value: '30', note: 'Phone distracted me.' },
    ],
  },
]