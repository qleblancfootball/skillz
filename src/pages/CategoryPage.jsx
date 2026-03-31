import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import SkillCard from '../components/SkillCard'

const ACTIVITY_TYPES = [
  {
    key: 'regular_timer',
    title: 'Regular Timer',
    badge: 'Base',
    text: 'Standard hold-and-release timer with solve history, PB tracking, and notes.',
  },
  {
    key: 'scramble_timer',
    title: 'Scramble + Timer',
    badge: 'Generated',
    text: 'Build a scramble bank, choose a scramble, then solve with the same main timer.',
  },
  {
    key: 'ao5_timer',
    title: 'Average of 5',
    badge: 'Session',
    text: 'Complete 5 solves in sequence and save the final Ao5 result to history.',
  },
]

export default function CategoryPage({
  category,
  skills,
  onBack,
  onOpenSkill,
  onAddPresetSkill,
}) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedType, setSelectedType] = useState('regular_timer')
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [image, setImage] = useState('')
  const [notes, setNotes] = useState('')

  const filteredSkills = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return skills

    return skills.filter((skill) => skill.name.toLowerCase().includes(term))
  }, [skills, search])

  function resetForm() {
    setSelectedType('regular_timer')
    setName('')
    setGoal('')
    setImage('')
    setNotes('')
    setShowForm(false)
  }

  function handleSubmit(e) {
    e.preventDefault()

    onAddPresetSkill(category.id, selectedType, {
      name,
      goal,
      image,
      notes,
    })

    resetForm()
  }

  return (
    <Layout
      title={category.name}
      subtitle={`${skills.length} activit${skills.length === 1 ? 'y' : 'ies'} inside this folder`}
      onBack={onBack}
    >
      <div className="hero-card compact-hero">
        <div>
          <p className="hero-eyebrow">Folder</p>
          <h2 className="hero-title">{category.name}</h2>
          <p className="hero-text">
            Add focused training modes for this folder and keep each activity’s
            PB, goal, and solve history separate.
          </p>
        </div>
      </div>

      <div className="top-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? 'Close Activity Form' : '+ New Activity'}
        </button>
      </div>

      <div className="search-card">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activities in this folder..."
          className="app-input"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="panel-card">
          <h3 className="panel-title">Create Activity</h3>

          <div className="activity-type-grid">
            {ACTIVITY_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                className={`activity-type-card ${selectedType === type.key ? 'active' : ''}`}
                onClick={() => setSelectedType(type.key)}
              >
                <div className="activity-type-top">
                  <span className="activity-type-badge">{type.badge}</span>
                  <span className="activity-type-badge">
                    {selectedType === type.key ? 'Selected' : 'Choose'}
                  </span>
                </div>

                <h4 className="activity-type-title">{type.title}</h4>
                <p className="activity-type-text">{type.text}</p>
              </button>
            ))}
          </div>

          <div className="field-group">
            <label className="field-label">Activity Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leave blank to use the default activity name"
              className="app-input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Goal Time (optional)</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Example: 12.50 or 1:05.00"
              className="app-input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Image URL (optional)</label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Paste image URL"
              className="app-input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Starter Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Add notes, focus points, or reminders"
              className="app-input app-textarea"
            />
          </div>

          <button type="submit" className="primary-button full-width">
            Save Activity
          </button>
        </form>
      )}

      <div className="stack-list">
        {filteredSkills.length === 0 ? (
          <div className="empty-card">
            <p className="empty-title">No activities found</p>
            <p className="empty-text">
              Add a timer activity to start tracking solves in this folder.
            </p>
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