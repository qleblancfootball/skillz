import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import ImageWithFallback from '../components/ImageWithFallback'
import {
  formatSolveTime,
  getActivityTypeLabel,
} from '../lib/rubiks'

export default function SkillPage({
  skill,
  onBack,
  onUpdateSkill,
  onDeleteSkill,
  onUpdateSkillEntry,
  onDeleteSkillEntry,
  onOpenRubiksTimer,
}) {
  const [name, setName] = useState(skill.name)
  const [goal, setGoal] = useState(skill.goal || '')
  const [notes, setNotes] = useState(skill.notes || '')
  const [image, setImage] = useState(skill.image || '')
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editedNote, setEditedNote] = useState('')

  const typeLabel = getActivityTypeLabel(skill.templateType)

  const solveCount = skill.progress.length

  const latestEntry = useMemo(() => {
    return skill.progress[0] || null
  }, [skill.progress])

  function handleSaveActivityDetails() {
    onUpdateSkill(skill.id, {
      name: name.trim() || skill.name,
      goal: goal.trim(),
      notes: notes.trim(),
      image: image.trim(),
    })
  }

  function handleStartEditEntry(entry) {
    setEditingEntryId(entry.id)
    setEditedNote(entry.note || '')
  }

  function handleCancelEditEntry() {
    setEditingEntryId(null)
    setEditedNote('')
  }

  function handleSaveEntryNote(entryId) {
    onUpdateSkillEntry(skill.id, entryId, {
      note: editedNote,
    })
    handleCancelEditEntry()
  }

  return (
    <Layout
      title={skill.name}
      subtitle={`${typeLabel} • ${solveCount} saved entr${solveCount === 1 ? 'y' : 'ies'}`}
      onBack={onBack}
    >
      <div className="hero-card">
        <div>
          <p className="hero-eyebrow">Activity</p>
          <h2 className="hero-title">{skill.name}</h2>
          <p className="hero-text">
            Launch the timer, chase your best result, and keep the notes tied to
            this activity only.
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-pill">
            <span className="stat-label">{skill.pbLabel || 'PB'}</span>
            <span className="stat-value">
              {skill.pb ? formatSolveTime(skill.pb) : '—'}
            </span>
          </div>

          <div className="stat-pill">
            <span className="stat-label">Goal</span>
            <span className="stat-value">
              {skill.goal ? formatSolveTime(skill.goal) : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-grid">
          <div className="mini-card">
            <p className="mini-card-label">Type</p>
            <p className="mini-card-value">{typeLabel}</p>
          </div>

          <div className="mini-card">
            <p className="mini-card-label">PB</p>
            <p className="mini-card-value">
              {skill.pb ? formatSolveTime(skill.pb) : 'No PB yet'}
            </p>
          </div>

          <div className="mini-card">
            <p className="mini-card-label">Latest</p>
            <p className="mini-card-value">
              {latestEntry ? formatSolveTime(latestEntry.value) : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="top-actions">
        <button type="button" className="primary-button" onClick={onOpenRubiksTimer}>
          Open Timer Activity
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            const confirmed = window.confirm(`Delete "${skill.name}"?`)
            if (confirmed) {
              onDeleteSkill(skill.id)
            }
          }}
        >
          Delete Activity
        </button>
      </div>

      <div className="panel-card">
        <h3 className="panel-title">Activity Settings</h3>

        <div className="field-group">
          <label className="field-label">Activity Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="app-input"
          />
        </div>

        <div className="field-group">
          <label className="field-label">Goal Time</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Example: 12.50 or 1:05.00"
            className="app-input"
          />
        </div>

        <div className="field-group">
          <label className="field-label">Image URL</label>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Paste image URL"
            className="app-input"
          />
        </div>

        <div className="field-group">
          <label className="field-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="4"
            className="app-input app-textarea"
            placeholder="Training notes, reminders, or session focus"
          />
        </div>

        <button
          type="button"
          className="primary-button full-width"
          onClick={handleSaveActivityDetails}
        >
          Save Activity Settings
        </button>

        {image.trim() ? (
          <ImageWithFallback
            src={image.trim()}
            alt={skill.name}
            className="activity-hero-image"
          />
        ) : null}
      </div>

      <div className="panel-card">
        <h3 className="panel-title">Solve History</h3>

        {skill.progress.length === 0 ? (
          <div className="empty-card">
            <p className="empty-title">No solves saved yet</p>
            <p className="empty-text">
              Open the timer to record your first result for this activity.
            </p>
          </div>
        ) : (
          <div className="stack-list">
            {skill.progress.map((entry) => {
              const isEditing = editingEntryId === entry.id

              return (
                <div key={entry.id} className="entry-card">
                  <div className="entry-card-top">
                    <div>
                      <p className="entry-time">{formatSolveTime(entry.value)}</p>
                      <p className="entry-date">{entry.date || 'Unknown date'}</p>
                    </div>

                    <div className="skill-type-pill">Locked Time</div>
                  </div>

                  <div className="entry-lock">
                    🔒 Solve time cannot be edited after it is recorded.
                  </div>

                  {isEditing ? (
                    <>
                      <div className="field-group" style={{ marginTop: '12px' }}>
                        <label className="field-label">Solve Note</label>
                        <textarea
                          value={editedNote}
                          onChange={(e) => setEditedNote(e.target.value)}
                          className="app-input app-textarea"
                          rows="4"
                          placeholder="Update your note for this solve"
                        />
                      </div>

                      <div className="button-row">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handleSaveEntryNote(entry.id)}
                        >
                          Save Note
                        </button>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={handleCancelEditEntry}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="entry-note">{entry.note || 'No note added.'}</p>

                      <div className="entry-actions">
                        <button
                          type="button"
                          className="small-dark-button"
                          onClick={() => handleStartEditEntry(entry)}
                        >
                          Edit Note
                        </button>

                        <button
                          type="button"
                          className="small-danger-button"
                          onClick={() => onDeleteSkillEntry(skill.id, entry.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}