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
  const [showCelebration, setShowCelebration] = useState(false)

  const [scrambleBank, setScrambleBank] = useState(() => generateScrambleBank(100))
  const [selectedScramble, setSelectedScramble] = useState('')
  const [scrambleConfirmed, setScrambleConfirmed] = useState(
    activityType !== 'scramble_timer'
  )

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

  async function promptSaveSingleSolve() {
    if (stoppedSeconds === null) return

    const shouldSave = window.confirm(
      `Save ${formatSolveTime(stoppedSeconds)} to your leaderboard?`
    )

    if (!shouldSave) {
      if (activityType === 'scramble_timer') {
        resetTimerFace()
        resetScrambleFlow()
      } else {
        resetTimerFace()
      }
      return
    }

    let note = ''

    if (activityType === 'scramble_timer' && selectedScramble) {
      note = `Scramble: ${selectedScramble}`
    }

    await onSaveSolve({
      date: formatDateInput(),
      value: stoppedSeconds.toFixed(2),
      note,
    })

    await maybeCelebrateAndPrompt(stoppedSeconds.toFixed(2))

    if (activityType === 'scramble_timer') {
      resetTimerFace()
      resetScrambleFlow()
    } else {
      resetTimerFace()
    }
  }

  async function saveAo5Session() {
    if (!ao5Complete || ao5Average === null) return

    const shouldSave = window.confirm(
      `Save Ao5 result ${formatSolveTime(ao5Average)} to your leaderboard?`
    )

    if (!shouldSave) {
      setAo5Solves([])
      setAo5NeedsContinue(false)
      setAo5Complete(false)
      resetTimerFace()
      return
    }

    const note = `Ao5 solves: ${ao5Solves.map((solve) => formatSolveTime(solve)).join(', ')}`

    await onSaveSolve({
      date: formatDateInput(),
      value: ao5Average.toFixed(2),
      note,
    })

    await maybeCelebrateAndPrompt(ao5Average.toFixed(2))

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
    if (timerState === 'stopped') return 'Solve complete'

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

        {activityType === 'ao5_timer' && ao5Complete ? (
          <div className="timer-overlay-panel">
            <div className="timer-overlay-title">
              Ao5 Result: {ao5Average !== null ? formatSolveTime(ao5Average) : '—'}
            </div>

            <div className="timer-action-row">
              <button
                type="button"
                className="timer-action-button"
                onClick={saveAo5Session}
              >
                Save Ao5
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
          </div>
        ) : null}

        {(activityType === 'regular_timer' || activityType === 'scramble_timer') &&
        timerState === 'stopped' ? (
          <div className="timer-overlay-panel">
            <div className="timer-overlay-title">
              Solve: {formatSolveTime(stoppedSeconds)}
            </div>

            <div className="timer-action-row">
              <button
                type="button"
                className="timer-action-button"
                onClick={promptSaveSingleSolve}
              >
                Continue
              </button>

              <button
                type="button"
                className="timer-secondary-button"
                onClick={() => {
                  if (activityType === 'scramble_timer') {
                    resetTimerFace()
                    resetScrambleFlow()
                  } else {
                    resetTimerFace()
                  }
                }}
              >
                Discard
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}