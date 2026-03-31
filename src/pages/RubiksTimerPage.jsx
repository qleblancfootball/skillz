import { useEffect, useMemo, useRef, useState } from 'react'
import {
  calculateAo5,
  compareGoalHit,
  formatDateInput,
  formatSolveTime,
  generateScrambleBank,
  getActivityTypeLabel,
} from '../lib/rubiks'

function CelebrationOverlay() {
  return (
    <div className="celebration-overlay">
      <div className="firework firework-1" />
      <div className="firework firework-2" />
      <div className="firework firework-3" />
      <div className="firework firework-4" />
      <div className="firework firework-5" />

      <div>
        <div className="celebration-text">Goal Crushed 🎉</div>
        <div className="celebration-subtext">That solve hit your target time.</div>
      </div>
    </div>
  )
}

export default function RubiksTimerPage({
  skill,
  onBack,
  onSaveSolve,
  onUpdateSkill,
}) {
  const activityType = skill.templateType || 'regular_timer'
  const activityLabel = getActivityTypeLabel(activityType)

  const [timerState, setTimerState] = useState('idle')
  const [displaySeconds, setDisplaySeconds] = useState(0)
  const [stoppedSeconds, setStoppedSeconds] = useState(null)
  const [solveNote, setSolveNote] = useState('')
  const [showCelebration, setShowCelebration] = useState(false)

  const [scrambleBank, setScrambleBank] = useState(() => generateScrambleBank(100))
  const [scrambleIndex, setScrambleIndex] = useState(0)
  const [scrambleConfirmed, setScrambleConfirmed] = useState(activityType !== 'scramble_timer')

  const [ao5Solves, setAo5Solves] = useState([])
  const [ao5NeedsContinue, setAo5NeedsContinue] = useState(false)
  const [ao5Complete, setAo5Complete] = useState(false)

  const rafRef = useRef(null)
  const readyTimeoutRef = useRef(null)
  const startTimeRef = useRef(null)
  const pointerHoldingRef = useRef(false)
  const currentStateRef = useRef('idle')

  useEffect(() => {
    currentStateRef.current = timerState
  }, [timerState])

  useEffect(() => {
    document.body.classList.add('timer-page-active')

    return () => {
      document.body.classList.remove('timer-page-active')
      clearTimeout(readyTimeoutRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const currentScramble = useMemo(() => {
    return scrambleBank[scrambleIndex] || ''
  }, [scrambleBank, scrambleIndex])

  const currentAo5Number = ao5Solves.length + 1
  const ao5Average = ao5Complete ? calculateAo5(ao5Solves) : null

  function resetTimerFace() {
    cancelAnimationFrame(rafRef.current)
    clearTimeout(readyTimeoutRef.current)
    pointerHoldingRef.current = false
    startTimeRef.current = null
    setTimerState('idle')
    setDisplaySeconds(0)
    setStoppedSeconds(null)
  }

  function animateTimer() {
    if (!startTimeRef.current) return

    const now = performance.now()
    const elapsedSeconds = (now - startTimeRef.current) / 1000
    setDisplaySeconds(elapsedSeconds)
    rafRef.current = requestAnimationFrame(animateTimer)
  }

  function startTimer() {
    cancelAnimationFrame(rafRef.current)
    setStoppedSeconds(null)
    setSolveNote('')
    setTimerState('running')
    startTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(animateTimer)
  }

  function stopTimer() {
    if (currentStateRef.current !== 'running' || !startTimeRef.current) return

    cancelAnimationFrame(rafRef.current)

    const elapsedSeconds = Number(
      (((performance.now() - startTimeRef.current) / 1000)).toFixed(2)
    )

    setDisplaySeconds(elapsedSeconds)
    setStoppedSeconds(elapsedSeconds)
    setTimerState('stopped')
    startTimeRef.current = null

    if (activityType === 'ao5_timer') {
      const updatedSolves = [...ao5Solves, elapsedSeconds]
      setAo5Solves(updatedSolves)

      if (updatedSolves.length === 5) {
        setAo5Complete(true)
        setAo5NeedsContinue(false)
      } else {
        setAo5NeedsContinue(true)
      }
    }
  }

  function handlePressStart(event) {
    event.preventDefault()

    if (currentStateRef.current === 'running') {
      stopTimer()
      return
    }

    if (activityType === 'scramble_timer' && !scrambleConfirmed) {
      return
    }

    if (activityType === 'ao5_timer' && ao5NeedsContinue) {
      return
    }

    if (currentStateRef.current !== 'idle') return

    pointerHoldingRef.current = true
    setTimerState('holding')

    readyTimeoutRef.current = setTimeout(() => {
      if (!pointerHoldingRef.current) return
      setTimerState('ready')
    }, 260)
  }

  function handlePressEnd(event) {
    event.preventDefault()

    clearTimeout(readyTimeoutRef.current)

    if (!pointerHoldingRef.current) return
    pointerHoldingRef.current = false

    if (currentStateRef.current === 'ready') {
      startTimer()
    } else if (currentStateRef.current === 'holding') {
      setTimerState('idle')
    }
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code !== 'Space') return
      if (event.repeat) return
      event.preventDefault()
      handlePressStart(event)
    }

    function handleKeyUp(event) {
      if (event.code !== 'Space') return
      event.preventDefault()
      handlePressEnd(event)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [activityType, ao5NeedsContinue, scrambleConfirmed, ao5Solves])

  async function maybeCelebrateAndPrompt(savedValue) {
    if (!compareGoalHit(savedValue, skill.goal)) return

    setShowCelebration(true)

    setTimeout(async () => {
      setShowCelebration(false)

      const wantsNewGoal = window.confirm(
        'You reached or beat your goal. Do you want to set a new goal now?'
      )

      if (!wantsNewGoal) return

      const nextGoal = window.prompt(
        'Enter a new goal time (for example 11.90 or 1:02.50):',
        skill.goal || ''
      )

      if (nextGoal === null) return

      await onUpdateSkill({
        goal: nextGoal.trim(),
      })
    }, 2200)
  }

  async function saveRegularOrScrambleSolve() {
    if (stoppedSeconds === null) return

    let note = solveNote.trim()

    if (activityType === 'scramble_timer' && currentScramble) {
      note = note
        ? `Scramble: ${currentScramble}\n\n${note}`
        : `Scramble: ${currentScramble}`
    }

    await onSaveSolve({
      date: formatDateInput(),
      value: stoppedSeconds.toFixed(2),
      note,
    })

    await maybeCelebrateAndPrompt(stoppedSeconds.toFixed(2))

    if (activityType === 'scramble_timer') {
      const nextIndex = scrambleIndex + 1

      if (nextIndex >= scrambleBank.length) {
        setScrambleBank(generateScrambleBank(100))
        setScrambleIndex(0)
      } else {
        setScrambleIndex(nextIndex)
      }

      setScrambleConfirmed(false)
    }

    resetTimerFace()
  }

  async function saveAo5Session() {
    if (!ao5Complete || ao5Average === null) return

    const noteLines = [
      `Ao5 solves: ${ao5Solves.map((solve) => formatSolveTime(solve)).join(', ')}`,
    ]

    if (solveNote.trim()) {
      noteLines.push('', solveNote.trim())
    }

    await onSaveSolve({
      date: formatDateInput(),
      value: ao5Average.toFixed(2),
      note: noteLines.join('\n'),
    })

    await maybeCelebrateAndPrompt(ao5Average.toFixed(2))

    setAo5Solves([])
    setAo5NeedsContinue(false)
    setAo5Complete(false)
    setSolveNote('')
    resetTimerFace()
  }

  function continueAo5() {
    setAo5NeedsContinue(false)
    setStoppedSeconds(null)
    setDisplaySeconds(0)
    setTimerState('idle')
  }

  function getTimerLabel() {
    if (activityType === 'ao5_timer') {
      if (ao5Complete) return 'Ao5 Complete'
      return `Solve ${currentAo5Number} of 5`
    }

    if (activityType === 'scramble_timer') {
      return 'Scramble Timer'
    }

    return 'Regular Timer'
  }

  function getTimerHelpText() {
    if (timerState === 'holding') return 'Keep holding...'
    if (timerState === 'ready') return 'Release to start'
    if (timerState === 'running') return 'Tap screen or press space to stop'
    if (timerState === 'stopped') return 'Review and save your result'

    if (activityType === 'scramble_timer' && !scrambleConfirmed) {
      return 'Choose and confirm a scramble before starting'
    }

    if (activityType === 'ao5_timer' && ao5NeedsContinue) {
      return 'Continue when you are ready for the next solve'
    }

    return 'Hold the screen or press space, then release to start'
  }

  function getScreenStateClass() {
    if (timerState === 'holding') return 'timer-screen-holding'
    if (timerState === 'ready') return 'timer-screen-ready'
    if (timerState === 'running') return 'timer-screen-running'
    if (timerState === 'stopped') return 'timer-screen-stopped'
    return ''
  }

  return (
    <div className="timer-page-shell">
      {showCelebration ? <CelebrationOverlay /> : null}

      <div className="timer-page-topbar">
        <button type="button" className="timer-back-button" onClick={onBack}>
          ← Back
        </button>

        <div className="timer-top-pill">{activityLabel}</div>
      </div>

      <div className="timer-page-body">
        <div className="timer-info-card">
          <h1 className="timer-info-title">{skill.name}</h1>
          <p className="timer-info-text">
            PB: {skill.pb ? formatSolveTime(skill.pb) : 'No PB yet'} • Goal:{' '}
            {skill.goal ? formatSolveTime(skill.goal) : 'Not set'}
          </p>
        </div>

        <div className="mini-grid">
          <div className="mini-card">
            <p className="mini-card-label">PB</p>
            <p className="mini-card-value">
              {skill.pb ? formatSolveTime(skill.pb) : '—'}
            </p>
          </div>

          <div className="mini-card">
            <p className="mini-card-label">Goal</p>
            <p className="mini-card-value">
              {skill.goal ? formatSolveTime(skill.goal) : '—'}
            </p>
          </div>

          <div className="mini-card">
            <p className="mini-card-label">History</p>
            <p className="mini-card-value">{skill.progress.length}</p>
          </div>
        </div>

        <div
          className={`timer-screen ${getScreenStateClass()}`}
          role="button"
          tabIndex={0}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
        >
          <div className="timer-label">{getTimerLabel()}</div>
          <div className="timer-value">
            {formatSolveTime(
              timerState === 'stopped' ? stoppedSeconds : displaySeconds
            )}
          </div>
          <div className="timer-help">{getTimerHelpText()}</div>
        </div>

        <div className="timer-bottom-card">
          {activityType === 'scramble_timer' && !scrambleConfirmed ? (
            <>
              <h3 className="panel-title">Scramble Bank</h3>
              <div className="scramble-bank">
                {scrambleBank.slice(scrambleIndex, scrambleIndex + 8).map((scramble, index) => {
                  const actualIndex = scrambleIndex + index
                  const isActive = actualIndex === scrambleIndex

                  return (
                    <button
                      key={`${scramble}-${actualIndex}`}
                      type="button"
                      className={`scramble-card ${isActive ? 'active' : ''}`}
                      onClick={() => setScrambleIndex(actualIndex)}
                    >
                      <p className="scramble-index">Scramble {actualIndex + 1}</p>
                      <p className="scramble-text">{scramble}</p>
                    </button>
                  )
                })}
              </div>

              <div className="timer-action-row" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="timer-action-button"
                  onClick={() => setScrambleConfirmed(true)}
                >
                  Use This Scramble
                </button>

                <button
                  type="button"
                  className="timer-secondary-button"
                  onClick={() => setScrambleBank(generateScrambleBank(100))}
                >
                  Regenerate Bank
                </button>
              </div>
            </>
          ) : null}

          {activityType === 'scramble_timer' && scrambleConfirmed ? (
            <>
              <h3 className="panel-title">Current Scramble</h3>
              <p className="scramble-text">{currentScramble}</p>

              {timerState === 'stopped' ? (
                <>
                  <div className="field-group" style={{ marginTop: '14px' }}>
                    <label className="field-label">Solve Note (optional)</label>
                    <textarea
                      value={solveNote}
                      onChange={(e) => setSolveNote(e.target.value)}
                      rows="4"
                      className="app-input app-textarea"
                      placeholder="Add quick thoughts on the solve"
                    />
                  </div>

                  <div className="timer-action-row">
                    <button
                      type="button"
                      className="timer-action-button"
                      onClick={saveRegularOrScrambleSolve}
                    >
                      Save Solve
                    </button>

                    <button
                      type="button"
                      className="timer-secondary-button"
                      onClick={resetTimerFace}
                    >
                      Discard
                    </button>
                  </div>
                </>
              ) : null}
            </>
          ) : null}

          {activityType === 'regular_timer' ? (
            <>
              <h3 className="panel-title">Regular Solve</h3>
              <p className="timer-info-text">
                Standard timer flow. Record the time, then optionally attach a note.
              </p>

              {timerState === 'stopped' ? (
                <>
                  <div className="field-group" style={{ marginTop: '14px' }}>
                    <label className="field-label">Solve Note (optional)</label>
                    <textarea
                      value={solveNote}
                      onChange={(e) => setSolveNote(e.target.value)}
                      rows="4"
                      className="app-input app-textarea"
                      placeholder="What happened on this solve?"
                    />
                  </div>

                  <div className="timer-action-row">
                    <button
                      type="button"
                      className="timer-action-button"
                      onClick={saveRegularOrScrambleSolve}
                    >
                      Save Solve
                    </button>

                    <button
                      type="button"
                      className="timer-secondary-button"
                      onClick={resetTimerFace}
                    >
                      Discard
                    </button>
                  </div>
                </>
              ) : null}
            </>
          ) : null}

          {activityType === 'ao5_timer' ? (
            <>
              <h3 className="panel-title">Ao5 Session</h3>
              <p className="timer-info-text">
                Complete five solves in sequence. The saved result uses the middle
                three solves as the average.
              </p>

              <div className="ao5-splits">
                {Array.from({ length: 5 }).map((_, index) => {
                  const solve = ao5Solves[index]

                  return (
                    <div key={index} className="ao5-split-row">
                      <strong>Solve {index + 1}</strong>
                      <span>{solve ? formatSolveTime(solve) : 'Pending'}</span>
                    </div>
                  )
                })}
              </div>

              {ao5NeedsContinue ? (
                <div className="timer-action-row" style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    className="timer-action-button"
                    onClick={continueAo5}
                  >
                    Continue to Solve {currentAo5Number}
                  </button>

                  <button
                    type="button"
                    className="timer-secondary-button"
                    onClick={() => {
                      setAo5Solves([])
                      setAo5NeedsContinue(false)
                      setAo5Complete(false)
                      resetTimerFace()
                    }}
                  >
                    Reset Session
                  </button>
                </div>
              ) : null}

              {ao5Complete ? (
                <>
                  <div className="field-group" style={{ marginTop: '14px' }}>
                    <label className="field-label">Ao5 Note (optional)</label>
                    <textarea
                      value={solveNote}
                      onChange={(e) => setSolveNote(e.target.value)}
                      rows="4"
                      className="app-input app-textarea"
                      placeholder="Add notes about the whole session"
                    />
                  </div>

                  <div className="mini-card" style={{ marginTop: '12px' }}>
                    <p className="mini-card-label">Calculated Ao5</p>
                    <p className="mini-card-value">
                      {ao5Average !== null ? formatSolveTime(ao5Average) : '—'}
                    </p>
                  </div>

                  <div className="timer-action-row" style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      className="timer-action-button"
                      onClick={saveAo5Session}
                    >
                      Save Ao5 Result
                    </button>

                    <button
                      type="button"
                      className="timer-secondary-button"
                      onClick={() => {
                        setAo5Solves([])
                        setAo5NeedsContinue(false)
                        setAo5Complete(false)
                        resetTimerFace()
                      }}
                    >
                      Start Fresh
                    </button>
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}