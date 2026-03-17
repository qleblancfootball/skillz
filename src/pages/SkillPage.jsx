import { useState } from 'react'
import Layout from '../components/Layout'
import ImageWithFallback from '../components/ImageWithFallback'

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
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

  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editEntryValue, setEditEntryValue] = useState('')
  const [editEntryNote, setEditEntryNote] = useState('')
  const [editEntryDate, setEditEntryDate] = useState(getTodayDate())

  const isPresetLocked = !!skill.isPresetLocked
  const isRubiksTimer = skill.templateType === 'rubiks_timer'

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

  function handleSaveSkillChanges() {
    if (isPresetLocked) {
      setShowEdit(false)
      return
    }

    onUpdateSkill(skill.id, {
      notes: editNotes,
      ranking: editRanking,
      image: editImage,
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

  return (
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
                    This skill uses a built-in preset. Core setup stays fixed so the timer
                    works properly.
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
            <p style={{ marginTop: '8px', color: '#e2e8f0' }}>{skill.lastUpdated}</p>
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
                Progress
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

            {!isRubiksTimer && showForm && (
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
          </div>
        </div>
      </div>
    </Layout>
  )
}