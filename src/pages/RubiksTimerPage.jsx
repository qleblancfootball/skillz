import { useEffect, useRef, useState } from 'react'

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

function formatTimerDisplay(ms) {
  const totalSeconds = ms / 1000

  if (totalSeconds < 60) {
    return totalSeconds.toFixed(2)
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toFixed(2).padStart(5, '0')
  return `${minutes}:${seconds}`
}

export default function RubiksTimerPage({ skill, onBack, onSaveSolve }) {
  const [phase, setPhase] = useState('idle')
  const [timerMs, setTimerMs] = useState(0)
  const [finalTimerMs, setFinalTimerMs] = useState(null)
  const [note, setNote] = useState('')

  const timerStartRef = useRef(null)
  const timerIntervalRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  function startTimer() {
    timerStartRef.current = performance.now()

    timerIntervalRef.current = setInterval(() => {
      const elapsed = performance.now() - timerStartRef.current
      setTimerMs(elapsed)
    }, 10)
  }

  function stopTimer() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    const elapsed = performance.now() - timerStartRef.current
    setTimerMs(elapsed)
    setFinalTimerMs(elapsed)
  }

  function handlePointerDown() {
    if (phase === 'idle') {
      setPhase('armingStart')
      return
    }

    if (phase === 'running') {
      setPhase('armingStop')
    }
  }

  function handlePointerUp() {
    if (phase === 'armingStart') {
      setTimerMs(0)
      setFinalTimerMs(null)
      setPhase('running')
      startTimer()
      return
    }

    if (phase === 'armingStop') {
      stopTimer()
      setPhase('review')
    }
  }

  function handleSave() {
    if (finalTimerMs === null) return

    onSaveSolve({
      value: (finalTimerMs / 1000).toFixed(2),
      note: note.trim(),
      date: getTodayDate(),
    })

    setNote('')
    setTimerMs(0)
    setFinalTimerMs(null)
    setPhase('idle')
  }

  function handleDiscard() {
    setNote('')
    setTimerMs(0)
    setFinalTimerMs(null)
    setPhase('idle')
  }

  function getCenterText() {
    if (phase === 'idle') return 'Hold to start'
    if (phase === 'armingStart') return 'Release to start'
    if (phase === 'running') return formatTimerDisplay(timerMs)
    if (phase === 'armingStop') return formatTimerDisplay(timerMs)
    if (phase === 'review') return formatTimerDisplay(finalTimerMs || 0)
    return 'Hold to start'
  }

  function getSubText() {
    if (phase === 'idle') return skill.name
    if (phase === 'armingStart') return 'Ready...'
    if (phase === 'running') return 'Hold when done'
    if (phase === 'armingStop') return 'Release to stop'
    if (phase === 'review') return 'Solve complete'
    return ''
  }

  function getBackground() {
    if (phase === 'armingStart') {
      return 'linear-gradient(180deg, #4c2a03 0%, #2d1701 100%)'
    }

    if (phase === 'running') {
      return 'linear-gradient(180deg, #050b14 0%, #02060c 100%)'
    }

    if (phase === 'armingStop') {
      return 'linear-gradient(180deg, #2b0f0f 0%, #180808 100%)'
    }

    if (phase === 'review') {
      return 'linear-gradient(180deg, #0e3f1f 0%, #072510 100%)'
    }

    return 'linear-gradient(180deg, #08111f 0%, #03070d 100%)'
  }

  const showTimerNumber =
    phase === 'running' || phase === 'armingStop' || phase === 'review'

  return (
    <div
      onPointerDown={finalTimerMs === null ? handlePointerDown : undefined}
      onPointerUp={finalTimerMs === null ? handlePointerUp : undefined}
      style={{
        minHeight: '100vh',
        background: getBackground(),
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '18px',
          left: '18px',
          zIndex: 5,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            border: 'none',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            padding: '10px 14px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Rubik&apos;s Timer
          </p>

          <div
            style={{
              marginTop: '18px',
              fontSize: showTimerNumber ? '84px' : '42px',
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: '-0.05em',
            }}
          >
            {getCenterText()}
          </div>

          <p
            style={{
              margin: '16px 0 0 0',
              color: 'rgba(255,255,255,0.78)',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            {getSubText()}
          </p>
        </div>
      </div>

      {phase === 'review' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              borderRadius: '22px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(145deg, rgba(13, 20, 36, 0.98), rgba(9, 14, 25, 0.95))',
              boxShadow: '0 18px 60px rgba(0,0,0,0.28)',
              padding: '18px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '24px',
                letterSpacing: '-0.03em',
              }}
            >
              Add Solve
            </h2>

            <p
              style={{
                margin: '8px 0 0 0',
                color: '#9fb0c7',
                lineHeight: 1.45,
              }}
            >
              Your time is locked. Add notes if you want, then save or discard.
            </p>

            <div style={{ marginTop: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                Solve Time
              </label>

              <div
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(30,41,59,0.9)',
                  color: 'white',
                  padding: '13px 14px',
                  fontWeight: 800,
                  fontSize: '18px',
                }}
              >
                {formatTimerDisplay(finalTimerMs || 0)} sec
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                Notes
              </label>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="3"
                placeholder="Add solve notes if you want"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(30,41,59,0.9)',
                  color: 'white',
                  padding: '13px 14px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginTop: '16px',
              }}
            >
              <button
                type="button"
                onClick={handleSave}
                style={{
                  border: 'none',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #22d3ee 0%, #38bdf8 100%)',
                  color: '#07101d',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Add Solve
              </button>

              <button
                type="button"
                onClick={handleDiscard}
                style={{
                  border: 'none',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}