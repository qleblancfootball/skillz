import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import CategoryCard from '../components/CategoryCard'

export default function HomePage({
  categories,
  skills,
  onOpenCategory,
  onResetSkills,
  onAddNewCategory,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editImage, setEditImage] = useState('')

  const categorySkillCounts = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = skills.filter((skill) => skill.categoryId === category.id).length
      return acc
    }, {})
  }, [categories, skills])

  const totalSolveEntries = useMemo(() => {
    return skills.reduce((sum, skill) => sum + skill.progress.length, 0)
  }, [skills])

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return categories

    return categories.filter((category) =>
      category.name.toLowerCase().includes(term)
    )
  }, [categories, search])

  function handleCreateFolder(e) {
    e.preventDefault()
    if (!name.trim()) return

    onAddNewCategory({
      name: name.trim(),
      image: image.trim(),
    })

    setName('')
    setImage('')
    setShowForm(false)
  }

  function startEdit(category) {
    setEditingId(category.id)
    setEditName(category.name)
    setEditImage(category.image || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditImage('')
  }

  function saveEdit(categoryId) {
    if (!editName.trim()) return

    onUpdateCategory(categoryId, {
      name: editName.trim(),
      image: editImage.trim(),
    })

    cancelEdit()
  }

  return (
    <Layout
      title="Q Rubix"
      subtitle="Build folders, track solves, chase PBs, and train like a speedcuber."
    >
      <div className="hero-card">
        <div>
          <p className="hero-eyebrow">Cube Training Tracker</p>
          <h2 className="hero-title">Modern practice folders for your Rubik’s progress.</h2>
          <p className="hero-text">
            Create folders for sessions, events, or cube types. Inside each one,
            add focused timer activities and keep your solve history clean.
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-pill">
            <span className="stat-label">Folders</span>
            <span className="stat-value">{categories.length}</span>
          </div>

          <div className="stat-pill">
            <span className="stat-label">Activities</span>
            <span className="stat-value">{skills.length}</span>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-card-label">Folders</p>
          <p className="stat-card-value">{categories.length}</p>
        </div>

        <div className="stat-card">
          <p className="stat-card-label">Activities</p>
          <p className="stat-card-value">{skills.length}</p>
        </div>

        <div className="stat-card">
          <p className="stat-card-label">Saved Solves</p>
          <p className="stat-card-value">{totalSolveEntries}</p>
        </div>
      </div>

      <div className="top-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? 'Close Folder Form' : '+ New Folder'}
        </button>

        <button type="button" className="secondary-button" onClick={onResetSkills}>
          Reset all app data
        </button>
      </div>

      <div className="search-card">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search folders..."
          className="app-input"
        />
      </div>

      {showForm && (
        <form onSubmit={handleCreateFolder} className="panel-card">
          <h3 className="panel-title">Create Folder</h3>

          <div className="field-group">
            <label className="field-label">Folder Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="app-input"
              placeholder="Example: 3x3 Main / Summer Grind / One-Handed"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Cover Image URL (optional)</label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="app-input"
              placeholder="Paste image URL"
            />
          </div>

          <button type="submit" className="primary-button full-width">
            Save Folder
          </button>
        </form>
      )}

      <div className="stack-list">
        {filteredCategories.length === 0 ? (
          <div className="empty-card">
            <p className="empty-title">No folders found</p>
            <p className="empty-text">
              Create your first cube folder to start tracking activities.
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => {
            const count = categorySkillCounts[category.id] || 0
            const isEditing = editingId === category.id

            return (
              <div key={category.id}>
                <CategoryCard
                  category={category}
                  skillCount={count}
                  onClick={() => onOpenCategory(category.id)}
                  onEdit={() => startEdit(category)}
                  onDelete={() => onDeleteCategory(category.id)}
                />

                {isEditing && (
                  <div className="panel-card">
                    <h3 className="panel-title">Edit Folder</h3>

                    <div className="field-group">
                      <label className="field-label">Folder Name</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="app-input"
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Cover Image URL</label>
                      <input
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        className="app-input"
                      />
                    </div>

                    <div className="button-row">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => saveEdit(category.id)}
                      >
                        Save Changes
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </Layout>
  )
}