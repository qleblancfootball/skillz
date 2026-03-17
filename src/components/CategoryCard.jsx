import ImageWithFallback from './ImageWithFallback'

export default function CategoryCard({
  category,
  skillCount,
  onClick,
  onEdit,
  onDelete,
}) {
  return (
    <div className="category-card">
      <button type="button" onClick={onClick} className="category-main-button">
        <ImageWithFallback
          src={category.image}
          alt={category.name}
          style={{
            width: '100%',
            height: '160px',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        <div className="category-content">
          <div className="category-heading-row">
            <h2 className="category-title">{category.name}</h2>
            <span className="category-badge">
              {skillCount} skill{skillCount === 1 ? '' : 's'}
            </span>
          </div>

          <p className="category-caption">Tap to open this category</p>
        </div>
      </button>

      <div className="category-actions">
        <button type="button" className="small-dark-button" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="small-danger-button" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}