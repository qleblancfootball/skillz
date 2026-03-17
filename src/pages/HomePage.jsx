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
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [newName, setNewName] = useState('')
  const [newImage, setNewImage] = useState('')

  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editImage, setEditImage] = useState('')

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return categories

    return categories.filter((category) =>
      category.name.toLowerCase().includes(term)
    )
  }, [categories, search])

  function getSkillCount(categoryId) {
    return skills.filter((skill) => skill.categoryId === categoryId).length
  }

  function handleCreateCategory(e) {
    e.preventDefault()

    if (!newName.trim()) return

    onAddNewCategory({
      name: newName.trim(),
      image: newImage.trim(),
    })

    setNewName('')
    setNewImage('')
    setShowCreateForm(false)
  }

  function startEditCategory(category) {
    setEditingCategoryId(category.id)
    setEditName(category.name)
    setEditImage(category.image || '')
  }

  function cancelEditCategory() {
    setEditingCategoryId(null)
    setEditName('')
    setEditImage('')
  }

  function saveEditCategory(categoryId) {
    if (!editName.trim()) return

    onUpdateCategory(categoryId, {
      name: editName.trim(),
      image: editImage.trim(),
    })

    cancelEditCategory()
  }

  return (
    <Layout
      title="Skill Tracker"
      subtitle="Build categories, track progress, keep it clean."
    >
      <div className="hero-card">
        <div>
          <p className="hero-eyebrow">Home Base</p>
          <h2 className="hero-title">Your categories</h2>
          <p className="hero-text">
            Keep all your skills organized and easy to reach.
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-pill">
            <span className="stat-label">Categories</span>
            <span className="stat-value">{categories.length}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Skills</span>
            <span className="stat-value">{skills.length}</span>
          </div>
        </div>
      </div>

      <div className="top-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowCreateForm((prev) => !prev)}
        >
          {showCreateForm ? 'Close New Category' : '+ New Category'}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onResetSkills}
        >
          Reset App Data
        </button>
      </div>

      <div className="search-card">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="app-input"
        />
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateCategory} className="panel-card">
          <h3 className="panel-title">Create Category</h3>

          <div className="field-group">
            <label className="field-label">Category Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Example: Athletics"
              className="app-input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Image URL</label>
            <input
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              placeholder="Paste image URL"
              className="app-input"
            />
          </div>

          <button type="submit" className="primary-button full-width">
            Save Category
          </button>
        </form>
      )}

      <div className="stack-list">
        {filteredCategories.length === 0 ? (
          <div className="empty-card">
            <p className="empty-title">No categories found</p>
            <p className="empty-text">Try another search or create a new one.</p>
          </div>
        ) : (
          filteredCategories.map((category) => {
            const isEditing = editingCategoryId === category.id

            return (
              <div key={category.id}>
                <CategoryCard
                  category={category}
                  skillCount={getSkillCount(category.id)}
                  onClick={() => onOpenCategory(category.id)}
                  onEdit={() => startEditCategory(category)}
                  onDelete={() => onDeleteCategory(category.id)}
                />

                {isEditing && (
                  <div className="panel-card category-edit-card">
                    <h3 className="panel-title">Edit Category</h3>

                    <div className="field-group">
                      <label className="field-label">Category Name</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="app-input"
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Image URL</label>
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
                        onClick={() => saveEditCategory(category.id)}
                      >
                        Save Changes
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={cancelEditCategory}
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