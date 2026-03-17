export default function SkillCard({ skill, onClick }) {
  return (
    <button type="button" onClick={onClick} className="skill-card">
      <div className="skill-card-top">
        <h3 className="skill-title">{skill.name}</h3>
        <span className="skill-rank-pill">{skill.ranking || '—'}</span>
      </div>

      <div className="skill-meta-row">
        <div>
          <p className="skill-meta-label">{skill.pbLabel || 'PB'}</p>
          <p className="skill-meta-value">
            {skill.pb || '—'} {skill.unit || ''}
          </p>
        </div>

        <div className="skill-meta-right">
          <p className="skill-meta-label">Updated</p>
          <p className="skill-meta-value">{skill.lastUpdated || '—'}</p>
        </div>
      </div>
    </button>
  )
}