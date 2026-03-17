import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import SkillCard from '../components/SkillCard'

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function CategoryPage({
  category,
  skills,
  onBack,
  onOpenSkill,
  onAddNewSkill,
  onAddPresetSkill,
}) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [pb, setPb] = useState('')
  const [ranking, setRanking] = useState('')
  const [unit, setUnit] = useState('')
  const [valueLabel, setValueLabel] = useState('')
  const [pbLabel, setPbLabel] = useState('')
  const [image, setImage] = useState('')
  const [notes, setNotes] = useState('')
  const [goal, setGoal] = useState('')
  const [higherIsBetter, setHigherIsBetter] = useState(true)

  const filteredSkills = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return skills

    return skills.filter((skill) => skill.name.toLowerCase().includes(term))
  }, [skills, search])

  function handleSubmit(e) {
    e.preventDefault()

    if (!name.trim()) return

    onAddNewSkill({
      categoryId: category.id,
      name: name.trim(),
      pb: pb.trim(),
      ranking: ranking.trim(),
      unit: unit.trim(),
      valueLabel: valueLabel.trim() || 'Value',
      pbLabel: pbLabel.trim() || 'PB',
      higherIsBetter,
      image: image.trim(),
      notes: notes.trim(),
      goal: goal.trim(),
      lastUpdated: getTodayDate(),
    })

    setName('')
    setPb('')
    setRanking('')
    setUnit('')
    setValueLabel('')
    setPbLabel('')
    setImage('')
    setNotes('')
    setGoal('')
    setHigherIsBetter(true)
    setShowForm(false)
  }

  function handleAddRubiksPreset() {
    onAddPresetSkill(category.id, 'rubiks_timer')
    setShowForm(false)
  }

  function handleAddSpanishPreset() {
    onAddPresetSkill(category.id, 'spanish_vocab')
    setShowForm(false)
  }

  return (
    <Layout
      title={category.name}
      subtitle={`${skills.length} skill${skills.length === 1 ? '' : 's'} inside this category`}
      onBack={onBack}
    >
      <div className="hero-card compact-hero">
        <div>
          <p className="hero-eyebrow">Category</p>
          <h2 className="hero-title">{category.name}</h2>
          <p className="hero-text">
            Search skills, add custom ones, or drop in quick presets.
          </p>
        </div>
      </div>

      <div className="top-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? 'Close New Skill' : '+ New Skill'}
        </button>
      </div>

      <div className="search-card">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills in this category..."
          className="app-input"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="panel-card">
          <h3 className="panel-title">Create Skill</h3>

          <div
            style={{
              marginBottom: '14px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '12px',
              display: 'grid',
              gap: '10px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 800,
              }}
            >
              Quick Presets
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={handleAddRubiksPreset}
                style={{
                  border: 'none',
                  borderRadius: '14px',
                  background: 'rgba(34,211,238,0.16)',
                  color: '#67e8f9',
                  padding: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Rubik&apos;s Timer
              </button>

              <button
                type="button"
                onClick={handleAddSpanishPreset}
                style={{
                  border: 'none',
                  borderRadius: '14px',
                  background: 'rgba(168,85,247,0.18)',
                  color: '#e9d5ff',
                  padding: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Spanish Vocab
              </button>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Skill Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: 40 Yard Dash"
              className="app-input"
            />
          </div>

          <div className="two-col-grid">
            <div className="field-group">
              <label className="field-label">PB</label>
              <input
                value={pb}
                onChange={(e) => setPb(e.target.value)}
                placeholder="Example: 4.9"
                className="app-input"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Ranking</label>
              <input
                value={ranking}
                onChange={(e) => setRanking(e.target.value)}
                placeholder="Example: B+"
                className="app-input"
              />
            </div>
          </div>

          <div className="two-col-grid">
            <div className="field-group">
              <label className="field-label">Unit</label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="in, sec, min, lbs"
                className="app-input"
              />
            </div>

            <div className="field-group">
              <label className="field-label">PB Direction</label>
              <select
                value={higherIsBetter ? 'higher' : 'lower'}
                onChange={(e) => setHigherIsBetter(e.target.value === 'higher')}
                className="app-input"
              >
                <option value="higher">Higher is better</option>
                <option value="lower">Lower is better</option>
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Goal</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Example: 5, 4.8, 100"
              className="app-input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Value Label</label>
            <input
              value={valueLabel}
              onChange={(e) => setValueLabel(e.target.value)}
              placeholder="Example: Sprint Time"
              className="app-input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">PB Label</label>
            <input
              value={pbLabel}
              onChange={(e) => setPbLabel(e.target.value)}
              placeholder="Example: Best Time"
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
              rows="3"
              placeholder="Add starting notes"
              className="app-input app-textarea"
            />
          </div>

          <button type="submit" className="primary-button full-width">
            Save Skill
          </button>
        </form>
      )}

      <div className="stack-list">
        {filteredSkills.length === 0 ? (
          <div className="empty-card">
            <p className="empty-title">No skills found</p>
            <p className="empty-text">Try another search or add a new skill.</p>
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onClick={() => onOpenSkill(skill.id)}
            />
          ))
        )}
      </div>
    </Layout>
  )
}