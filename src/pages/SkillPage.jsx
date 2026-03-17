import { useEffect, useRef, useState } from 'react'
import Layout from '../components/Layout'
import ImageWithFallback from '../components/ImageWithFallback'
import FlipWordCard from '../components/FlipWordCard'

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

function parseGoalNumber(goal) {
  const num = parseFloat(goal)
  return Number.isNaN(num) ? null : num
}

function isGoalReached(skill) {
  const goalNum = parseGoalNumber(skill.goal)

  if (goalNum === null) return false

  if (skill.templateType === 'spanish_vocab') {
    return skill.progress.length >= goalNum
  }

  const pbNum = parseFloat(skill.pb)
  if (Number.isNaN(pbNum)) return false

  if (skill.higherIsBetter === false) {
    return pbNum <= goalNum
  }

  return pbNum >= goalNum
}

function GoalCelebrationOverlay() {
  const pieces = [
    { x: '-180px', y: '-140px', rotate: '15deg' },
    { x: '-140px', y: '-180px', rotate: '-22deg' },
    { x: '-90px', y: '-210px', rotate: '38deg' },
    { x: '-20px', y: '-220px', rotate: '-12deg' },
    { x: '40px', y: '-210px', rotate: '28deg' },
    { x: '100px', y: '-185px', rotate: '-35deg' },
    { x: '155px', y: '-145px', rotate: '10deg' },
    { x: '-170px', y: '-40px', rotate: '-18deg' },
    { x: '170px', y: '-30px', rotate: '26deg' },
    { x: '-145px', y: '60px', rotate: '14deg' },
    { x: '145px', y: '70px', rotate: '-20deg' },
    { x: '-95px', y: '150px', rotate: '30deg' },
    { x: '95px', y: '155px', rotate: '-28deg' },
    { x: '0px', y: '190px', rotate: '8deg' },
  ]

  const colors = [
    '#22d3ee',
    '#f472b6',
    '#facc15',
    '#a78bfa',
    '#4ade80',
    '#fb7185',
    '#38bdf8',
  ]

  return (
    <>
      <style>{`
        @keyframes goalBurst {
          0% {
            transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1.05) rotate(var(--r));
            opacity: 0;
          }
        }

        @keyframes goalCenterPop {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          18% {
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10000,
        }}
      >
        {pieces.map((piece, index) => (
          <div
            key={index}
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              width: '12px',
              height: '12px',
              borderRadius: '999px',
              background: colors[index % colors.length],
              boxShadow: `0 0 18px ${colors[index % colors.length]}`,
              '--x': piece.x,
              '--y': piece.y,
              '--r': piece.rotate,
              animation: 'goalBurst 1200ms ease-out forwards',
            }}
          />
        ))}

        <div
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '18px 24px',
            borderRadius: '999px',
            background: 'rgba(10,18,32,0.92)',
            color: 'white',
            fontWeight: 900,
            fontSize: '22px',
            letterSpacing: '-0.03em',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 70px rgba(0,0,0,0.35)',
            animation: 'goalCenterPop 1200ms ease-out forwards',
          }}
        >
          Goal hit 🎉
        </div>
      </div>
    </>
  )
}

export default function SkillPage({
  skill,
  onBack,
  onAddEntry,
  onUpdateSkill,
  onDeleteSkill,
  onUpdateSkillEntry,
  onDeleteSkillEntry,
  onOpenRubiksTimer,
}) {
  const [showForm, setShowForm] = useState(false)
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(getTodayDate())

  const [showEdit, setShowEdit] = useState(false)
  const [editNotes, setEditNotes] = useState(skill.notes)
  const [editRanking, setEditRanking] = useState(skill.ranking)
  const [editImage, setEditImage] = useState(skill.image)
  const [editGoal, setEditGoal] = useState(skill.goal || '')

  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editEntryValue, setEditEntryValue] = useState('')
  const [editEntryNote, setEditEntryNote] = useState('')
  const [editEntryDate, setEditEntryDate] = useState(getTodayDate())

  const [goalCelebrationVisible, setGoalCelebrationVisible] = useState(false)
  const prevGoalReachedRef = useRef(isGoalReached(skill))

  const [spanishWord, setSpanishWord] = useState('')
  const [englishMeaning, setEnglishMeaning] = useState('')

  const isPresetLocked = !!skill.isPresetLocked
  const isRubiksTimer = skill.templateType === 'rubiks_timer'
  const isSpanishVocab = skill.templateType === 'spanish_vocab'
  const goalReached = isGoalReached(skill)

  useEffect(() => {
    const previous = prevGoalReachedRef.current

    if (!previous && goalReached) {
      setGoalCelebrationVisible(true)
      const timer = setTimeout(() => {
        setGoalCelebrationVisible(false)
      }, 1300)

      prevGoalReachedRef.current = goalReached
      return () => clearTimeout(timer)
    }

    prevGoalReachedRef.current = goalReached
  }, [goalReached])

  function handleSubmit(e) {
    e.preventDefault()

    if (!value.trim()) return

    onAddEntry(skill.id, {
      value: value.trim(),
      note: note.trim(),
      date,
    })

    setValue('')
    setNote('')
    setDate(getTodayDate())
    setShowForm(false)
  }

  function handleSpanishSubmit(e) {
    e.preventDefault()

    if (!spanishWord.trim() || !englishMeaning.trim()) return

    onAddEntry(skill.id, {
      value: spanishWord.trim(),
      note: englishMeaning.trim(),
      date: getTodayDate(),
    })

    setSpanishWord('')
    setEnglishMeaning('')
    setShowForm(false)
  }

  function handleSaveSkillChanges() {
    if (isPresetLocked) {
      setShowEdit(false)
      return
    }

    onUpdateSkill(skill.id, {
      notes: editNotes,
      ranking: editRanking,
      image: editImage,
      goal: editGoal,
    })

    setShowEdit(false)
  }

  function handleDeleteSkill() {
    const confirmed = window.confirm(`Delete "${skill.name}"?`)
    if (confirmed) {
      onDeleteSkill(skill.id)
    }
  }

  function startEditingEntry(entry) {
    setEditingEntryId(entry.id)
    setEditEntryValue(entry.value)
    setEditEntryNote(entry.note)
    setEditEntryDate(entry.date)
  }

  function cancelEditingEntry() {
    setEditingEntryId(null)
    setEditEntryValue('')
    setEditEntryNote('')
    setEditEntryDate(getTodayDate())
  }

  function saveEditedEntry(entryId) {
    if (!editEntryValue.trim()) return

    onUpdateSkillEntry(skill.id, entryId, {
      value: editEntryValue.trim(),
      note: editEntryNote.trim(),
      date: editEntryDate,
    })

    cancelEditingEntry()
  }

  function handleDeleteEntry(entryId) {
    const confirmed = window.confirm('Delete this progress entry?')
    if (confirmed) {
      onDeleteSkillEntry(skill.id, entryId)
    }
  }

  function handlePlusClick() {
    if (isRubiksTimer) {
      onOpenRubiksTimer()
      return
    }

    setShowForm((prev) => !prev)
  }

  function renderGoalBlock() {
    const goalNum = parseGoalNumber(skill.goal)

    if (goalNum === null) {
      return (
        <div
          style={{
            marginTop: '18px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '14px',
          }}
        >
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}>
            Goal
          </p>
          <p style={{ margin: '8px 0 0 0', color: '#e2e8f0', fontWeight: 700 }}>
            No goal set yet
          </p>
        </div>
      )
    }

    let progressText = ''

    if (isSpanishVocab) {
      progressText = `${skill.progress.length} / ${goalNum} words`
    } else {
      progressText = `${skill.pb || '—'} ${skill.unit || ''} / ${goalNum} ${skill.unit || ''}`
    }

    return (
      <div
        style={{
          marginTop: '18px',
          borderRadius: '16px',
          background: goalReached
            ? 'linear-gradient(145deg, rgba(7, 61, 36, 0.95), rgba(6, 41, 25, 0.95))'
            : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '14px',
        }}
      >
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}>
          Goal
        </p>
        <p
          style={{
            margin: '8px 0 0 0',
            color: goalReached ? '#86efac' : '#e2e8f0',
            fontWeight: 800,
          }}
        >
          {goalNum} {isSpanishVocab ? 'words' : skill.unit || ''}
        </p>
        <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '14px' }}>
          {progressText}
        </p>
      </div>
    )
  }

  return (
    <>
      {goalCelebrationVisible && <GoalCelebrationOverlay />}

      <Layout title={skill.name} onBack={onBack}>
        <div
          style={{
            overflow: 'hidden',
            borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#1e293b',
          }}
        >
          <ImageWithFallback
            src={skill.image}
            alt={skill.name}
            style={{
              width: '100%',
              height: '220px',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          <div style={{ padding: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                  {skill.pbLabel || 'PB'}
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {skill.pb || '—'} {skill.unit || ''}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Ranking</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {skill.ranking || '—'}
                </p>
              </div>
            </div>

            {renderGoalBlock()}

            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowEdit((prev) => !prev)}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#334155',
                  color: 'white',
                  padding: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {showEdit ? 'Close Edit' : 'Edit Skill'}
              </button>
            </div>

            {showEdit && (
              <div
                style={{
                  marginTop: '12px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#0f172a',
                  padding: '14px',
                }}
              >
                {isPresetLocked ? (
                  <div>
                    <p
                      style={{
                        margin: 0,
                        color: '#67e8f9',
                        fontWeight: 'bold',
                      }}
                    >
                      Preset skill locked
                    </p>
                    <p
                      style={{
                        margin: '8px 0 0 0',
                        color: '#cbd5e1',
                        lineHeight: 1.45,
                      }}
                    >
                      This skill uses a built-in preset. Core setup stays fixed for the special feature.
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: '#94a3b8',
                          fontSize: '14px',
                        }}
                      >
                        Ranking
                      </label>
                      <input
                        value={editRanking}
                        onChange={(e) => setEditRanking(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: '#1e293b',
                          color: 'white',
                          padding: '12px',
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: '#94a3b8',
                          fontSize: '14px',
                        }}
                      >
                        Goal
                      </label>
                      <input
                        value={editGoal}
                        onChange={(e) => setEditGoal(e.target.value)}
                        placeholder="Example: 10"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: '#1e293b',
                          color: 'white',
                          padding: '12px',
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: '#94a3b8',
                          fontSize: '14px',
                        }}
                      >
                        Notes
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows="3"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: '#1e293b',
                          color: 'white',
                          padding: '12px',
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: '#94a3b8',
                          fontSize: '14px',
                        }}
                      >
                        Image URL
                      </label>
                      <input
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: '#1e293b',
                          color: 'white',
                          padding: '12px',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSkillChanges}
                      style={{
                        width: '100%',
                        background: '#22d3ee',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: '#0f172a',
                      }}
                    >
                      Save Changes
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleDeleteSkill}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    border: 'none',
                    borderRadius: '10px',
                    background: '#ef4444',
                    color: 'white',
                    padding: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Delete Skill
                </button>
              </div>
            )}

            <div style={{ marginTop: '22px' }}>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Notes</p>
              <p style={{ marginTop: '8px', color: '#e2e8f0' }}>{skill.notes}</p>
            </div>

            <div style={{ marginTop: '22px' }}>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Last Updated</p>
              <p style={{ marginTop: '8px', color: '#e2e8f0' }}>{skill.lastUpdated || '—'}</p>
            </div>

            <div style={{ marginTop: '22px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                  {isSpanishVocab ? 'Words Learned' : 'Progress'}
                </p>

                <button
                  type="button"
                  onClick={handlePlusClick}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '999px',
                    border: 'none',
                    background: '#22d3ee',
                    color: '#0f172a',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  +
                </button>
              </div>

              {!isRubiksTimer && !isSpanishVocab && showForm && (
                <form
                  onSubmit={handleSubmit}
                  style={{
                    marginBottom: '16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#0f172a',
                    padding: '14px',
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: '#94a3b8',
                        fontSize: '14px',
                      }}
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#1e293b',
                        color: 'white',
                        padding: '12px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: '#94a3b8',
                        fontSize: '14px',
                      }}
                    >
                      {skill.valueLabel || 'Value'} {skill.unit ? `(${skill.unit})` : ''}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={skill.unit ? `Enter value in ${skill.unit}` : 'Enter value'}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#1e293b',
                        color: 'white',
                        padding: '12px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: '#94a3b8',
                        fontSize: '14px',
                      }}
                    >
                      Notes
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="How did it feel? What did you work on?"
                      rows="3"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#1e293b',
                        color: 'white',
                        padding: '12px',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: '10px',
                      background: '#22d3ee',
                      color: '#0f172a',
                      padding: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Save Entry
                  </button>
                </form>
              )}

              {isSpanishVocab && showForm && (
                <form
                  onSubmit={handleSpanishSubmit}
                  style={{
                    marginBottom: '16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#0f172a',
                    padding: '14px',
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: '#94a3b8',
                        fontSize: '14px',
                      }}
                    >
                      Spanish Word
                    </label>
                    <input
                      type="text"
                      value={spanishWord}
                      onChange={(e) => setSpanishWord(e.target.value)}
                      placeholder="Example: casa"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#1e293b',
                        color: 'white',
                        padding: '12px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: '#94a3b8',
                        fontSize: '14px',
                      }}
                    >
                      English Meaning
                    </label>
                    <input
                      type="text"
                      value={englishMeaning}
                      onChange={(e) => setEnglishMeaning(e.target.value)}
                      placeholder="Example: house"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#1e293b',
                        color: 'white',
                        padding: '12px',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: '10px',
                      background: '#22d3ee',
                      color: '#0f172a',
                      padding: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Save Word
                  </button>
                </form>
              )}

              {isSpanishVocab ? (
                <div
                  style={{
                    display: 'grid',
                    gap: '12px',
                  }}
                >
                  {skill.progress.map((entry) => (
                    <div key={entry.id}>
                      <FlipWordCard front={entry.value} back={entry.note} />

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '8px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => startEditingEntry(entry)}
                          style={{
                            flex: 1,
                            border: 'none',
                            borderRadius: '10px',
                            background: '#334155',
                            color: 'white',
                            padding: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          style={{
                            flex: 1,
                            border: 'none',
                            borderRadius: '10px',
                            background: '#ef4444',
                            color: 'white',
                            padding: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>

                      {editingEntryId === entry.id && (
                        <div
                          style={{
                            marginTop: '10px',
                            borderRadius: '14px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: '#0f172a',
                            padding: '14px',
                          }}
                        >
                          <div style={{ marginBottom: '10px' }}>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '6px',
                                color: '#94a3b8',
                                fontSize: '14px',
                              }}
                            >
                              Spanish Word
                            </label>
                            <input
                              type="text"
                              value={editEntryValue}
                              onChange={(e) => setEditEntryValue(e.target.value)}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: '#1e293b',
                                color: 'white',
                                padding: '12px',
                              }}
                            />
                          </div>

                          <div style={{ marginBottom: '10px' }}>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '6px',
                                color: '#94a3b8',
                                fontSize: '14px',
                              }}
                            >
                              English Meaning
                            </label>
                            <input
                              type="text"
                              value={editEntryNote}
                              onChange={(e) => setEditEntryNote(e.target.value)}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: '#1e293b',
                                color: 'white',
                                padding: '12px',
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => saveEditedEntry(entry.id)}
                            style={{
                              width: '100%',
                              border: 'none',
                              borderRadius: '10px',
                              background: '#22d3ee',
                              color: '#0f172a',
                              padding: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                            }}
                          >
                            Save Word Changes
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditingEntry}
                            style={{
                              width: '100%',
                              marginTop: '8px',
                              border: 'none',
                              borderRadius: '10px',
                              background: '#334155',
                              color: 'white',
                              padding: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: '12px' }}>
                  {skill.progress.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#0f172a',
                        padding: '14px',
                        marginBottom: '12px',
                      }}
                    >
                      {editingEntryId === entry.id ? (
                        <>
                          <div style={{ marginBottom: '10px' }}>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '6px',
                                color: '#94a3b8',
                                fontSize: '14px',
                              }}
                            >
                              Date
                            </label>
                            <input
                              type="date"
                              value={editEntryDate}
                              onChange={(e) => setEditEntryDate(e.target.value)}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: '#1e293b',
                                color: 'white',
                                padding: '12px',
                              }}
                            />
                          </div>

                          <div style={{ marginBottom: '10px' }}>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '6px',
                                color: '#94a3b8',
                                fontSize: '14px',
                              }}
                            >
                              {skill.valueLabel || 'Value'} {skill.unit ? `(${skill.unit})` : ''}
                            </label>
                            <input
                              type="text"
                              value={editEntryValue}
                              onChange={(e) => setEditEntryValue(e.target.value)}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: '#1e293b',
                                color: 'white',
                                padding: '12px',
                              }}
                            />
                          </div>

                          <div style={{ marginBottom: '10px' }}>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '6px',
                                color: '#94a3b8',
                                fontSize: '14px',
                              }}
                            >
                              Notes
                            </label>
                            <textarea
                              value={editEntryNote}
                              onChange={(e) => setEditEntryNote(e.target.value)}
                              rows="3"
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: '#1e293b',
                                color: 'white',
                                padding: '12px',
                                resize: 'vertical',
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => saveEditedEntry(entry.id)}
                            style={{
                              width: '100%',
                              border: 'none',
                              borderRadius: '10px',
                              background: '#22d3ee',
                              color: '#0f172a',
                              padding: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                            }}
                          >
                            Save Entry Changes
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditingEntry}
                            style={{
                              width: '100%',
                              marginTop: '8px',
                              border: 'none',
                              borderRadius: '10px',
                              background: '#334155',
                              color: 'white',
                              padding: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '12px',
                            }}
                          >
                            <p style={{ margin: 0, fontWeight: 'bold' }}>
                              {entry.value} {skill.unit || ''}
                            </p>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                              {entry.date}
                            </p>
                          </div>

                          <p style={{ margin: '8px 0 0 0', color: '#cbd5e1' }}>{entry.note}</p>

                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              marginTop: '12px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => startEditingEntry(entry)}
                              style={{
                                flex: 1,
                                border: 'none',
                                borderRadius: '10px',
                                background: '#334155',
                                color: 'white',
                                padding: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(entry.id)}
                              style={{
                                flex: 1,
                                border: 'none',
                                borderRadius: '10px',
                                background: '#ef4444',
                                color: 'white',
                                padding: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}