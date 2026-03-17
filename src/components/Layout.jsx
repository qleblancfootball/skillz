export default function Layout({ title, subtitle, onBack, children }) {
  return (
    <div className="app-shell">
      <div className="app-glow app-glow-1" />
      <div className="app-glow app-glow-2" />

      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-top">
            {onBack ? (
              <button type="button" onClick={onBack} className="back-button">
                ← Back
              </button>
            ) : (
              <div className="brand-pill">QT Tracker</div>
            )}
          </div>

          <div className="app-header-text">
            <h1 className="app-title">{title}</h1>
            {subtitle ? <p className="app-subtitle">{subtitle}</p> : null}
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  )
}