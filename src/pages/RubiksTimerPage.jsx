import { useEffect, useRef, useState } from 'react'
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
  const [showCelebration, setShowCelebration] = useState(false)

  const [scrambleBank, setScrambleBank] = useState(() => generateScrambleBank(100))
  const [selectedScramble, setSelectedScramble] = useState('')
  const [scrambleConfirmed, setScrambleConfirmed] = useState(
    activityType !== 'scramble_timer'
  )

  const [ao5Solves, setAo5Solves] = useState([])
  const [ao5NeedsContinue, setAo5NeedsContinue] = useState(false)
  const [ao5Complete, setAo5Complete] = useState(false)

  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveNote, setSaveNote] = useState('')
  const [saveMode, setSaveMode] = useState('single') // single | ao5

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

  useEffect(() => {
    if (activityType === 'scramble_timer') {
      const bank = generateScrambleBank(100)
      setScrambleBank(bank)
      setSelectedScramble(bank[Math.floor(Math.random() * bank.length)] || '')
      setScrambleConfirmed(false)
    }
  }, [activityType])

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

  function resetScrambleFlow() {
    const bank = generateScrambleBank(100)
    const randomScramble = bank[Math.floor(Math.random() * bank.length)] || ''
    setScrambleBank(bank)
    setSelectedScramble(randomScramble)
    setScrambleConfirmed(false)
  }

  function closeSaveModal() {
    setSaveModalOpen(false)
    setSaveNote('')
    setSaveMode('single')
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
    setSaveNote('')
    setSaveModalOpen(false)
    setTimerState('running')
    startTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(animateTimer)
  }

  function stopTimer() {
    if (currentStateRef.current !== 'running' || !startTimeRef.current) return

    cancelAnimationFrame(rafRef.current)

    const elapsedSeconds = Number(
      ((performance.now() - startTimeRef.current) / 1000).toFixed(2)
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
        setSaveMode('ao5')
        setSaveModalOpen(true)
      } else {
        setAo5NeedsContinue(true)
      }

      return
    }

    setSaveMode('single')
    setSaveModalOpen(true)
  }

  function handlePressStart(event) {
    event.preventDefault()

    if (saveModalOpen) return

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
  }, [activityType, ao5NeedsContinue, scrambleConfirmed, ao5Solves, saveModalOpen])

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

  async function saveSingleSolve() {
    if (stoppedSeconds === null) return

    let note = saveNote.trim()

    if (activityType === 'scramble_timer' && selectedScramble) {
      note = note
        ? `Scramble: ${selectedScramble}\n\n${note}`
        : `Scramble: ${selectedScramble}`
    }

    await onSaveSolve({
      date: formatDateInput(),
      value: stoppedSeconds.toFixed(2),
      note,
    })

    closeSaveModal()
    await maybeCelebrateAndPrompt(stoppedSeconds.toFixed(2))

    if (activityType === 'scramble_timer') {
      resetTimerFace()
      resetScrambleFlow()
    } else {
      resetTimerFace()
    }
  }

  function discardSingleSolve() {
    closeSaveModal()

    if (activityType === 'scramble_timer') {
      resetTimerFace()
      resetScrambleFlow()
    } else {
      resetTimerFace()
    }
  }

  async function saveAo5Session() {
    if (!ao5Complete || ao5Average === null) return

    const noteLines = [
      `Ao5 solves: ${ao5Solves.map((solve) => formatSolveTime(solve)).join(', ')}`,
    ]

    if (saveNote.trim()) {
      noteLines.push('', saveNote.trim())
    }

    await onSaveSolve({
      date: formatDateInput(),
      value: ao5Average.toFixed(2),
      note: noteLines.join('\n'),
    })

    closeSaveModal()
    await maybeCelebrateAndPrompt(ao5Average.toFixed(2))

    setAo5Solves([])
    setAo5NeedsContinue(false)
    setAo5Complete(false)
    resetTimerFace()
  }

  function discardAo5Session() {
    closeSaveModal()
    setAo5Solves([])
    setAo5NeedsContinue(false)
    setAo5Complete(false)
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

    return activityLabel
  }

  function getTimerHelpText() {
    if (timerState === 'holding') return 'Keep holding...'
    if (timerState === 'ready') return 'Release to start'
    if (timerState === 'running') return 'Tap screen or press space to stop'
    if (timerState === 'stopped' && !saveModalOpen) return 'Solve complete'

    if (activityType === 'scramble_timer' && !scrambleConfirmed) {
      return 'Confirm the scramble to begin'
    }

    if (activityType === 'ao5_timer' && ao5NeedsContinue) {
      return 'Continue when ready for the next solve'
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

  if (activityType === 'scramble_timer' && !scrambleConfirmed) {
    return (
      <div className="timer-page-shell timer-page-shell-centered">
        {showCelebration ? <CelebrationOverlay /> : null}

        <div className="timer-page-topbar">
          <button type="button" className="timer-back-button" onClick={onBack}>
            ← Back
          </button>

          <div className="timer-top-pill">{activityLabel}</div>
        </div>

        <div className="timer-confirm-wrap">
          <div className="timer-confirm-card">
            <p className="timer-confirm-label">Random Scramble</p>
            <h1 className="timer-confirm-title">{skill.name}</h1>
            <p className="timer-confirm-scramble">{selectedScramble}</p>

            <div className="timer-action-row">
              <button
                type="button"
                className="timer-action-button"
                onClick={() => setScrambleConfirmed(true)}
              >
                Confirm Scramble
              </button>

              <button
                type="button"
                className="timer-secondary-button"
                onClick={resetScrambleFlow}
              >
                New Random Scramble
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="timer-page-shell timer-page-shell-full">
      {showCelebration ? <CelebrationOverlay /> : null}

      <div className="timer-page-topbar timer-page-topbar-overlay">
        <button type="button" className="timer-back-button" onClick={onBack}>
          ← Back
        </button>

        <div className="timer-top-pill">{getTimerLabel()}</div>
      </div>

      <div
        className={`timer-screen timer-screen-full ${getScreenStateClass()}`}
        role="button"
        tabIndex={0}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
      >
        {activityType === 'scramble_timer' && selectedScramble ? (
          <div className="timer-floating-scramble">{selectedScramble}</div>
        ) : null}

        {activityType === 'ao5_timer' ? (
          <div className="timer-floating-progress">
            {ao5Solves.map((solve, index) => (
              <span key={`${solve}-${index}`} className="timer-progress-pill">
                {index + 1}: {formatSolveTime(solve)}
              </span>
            ))}
          </div>
        ) : null}

        <div className="timer-value">
          {formatSolveTime(
            timerState === 'stopped' ? stoppedSeconds : displaySeconds
          )}
        </div>

        <div className="timer-help">{getTimerHelpText()}</div>

        {activityType === 'ao5_timer' && ao5NeedsContinue ? (
          <button
            type="button"
            className="timer-overlay-button"
            onClick={continueAo5}
          >
            Continue to Solve {currentAo5Number}
          </button>
        ) : null}
      </div>

      {saveModalOpen ? (
        <div className="timer-save-modal">
          <div className="timer-save-card">
            <p className="timer-save-label">
              {saveMode === 'ao5' ? 'Average of 5 Complete' : 'Solve Complete'}
            </p>

            <h2 className="timer-save-title">
              {saveMode === 'ao5'
                ? `Ao5: ${ao5Average !== null ? formatSolveTime(ao5Average) : '—'}`
                : `Time: ${formatSolveTime(stoppedSeconds)}`}
            </h2>

            {saveMode === 'single' && activityType === 'scramble_timer' && selectedScramble ? (
              <div className="timer-save-meta">
                <strong>Scramble:</strong> {selectedScramble}
              </div>
            ) : null}

            {saveMode === 'ao5' ? (
              <div className="timer-save-meta">
                <strong>Solves:</strong>{' '}
                {ao5Solves.map((solve) => formatSolveTime(solve)).join(', ')}
              </div>
            ) : null}

            <div className="field-group">
              <label className="field-label">
                Add Notes {saveMode === 'ao5' ? '(optional)' : '(optional)'}
              </label>
              <textarea
                value={saveNote}
                onChange={(e) => setSaveNote(e.target.value)}
                rows="5"
                className="app-input app-textarea"
                placeholder={
                  saveMode === 'ao5'
                    ? 'Add notes about this Ao5 session'
                    : 'Add notes about this solve'
                }
              />
            </div>

            <div className="timer-save-actions">
              <button
                type="button"
                className="timer-action-button"
                onClick={saveMode === 'ao5' ? saveAo5Session : saveSingleSolve}
              >
                Add to Leaderboard
              </button>

              <button
                type="button"
                className="timer-secondary-button"
                onClick={saveMode === 'ao5' ? discardAo5Session : discardSingleSolve}
              >
                Do Not Add
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}