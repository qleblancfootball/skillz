import { useEffect, useMemo, useState } from 'react'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import SkillPage from './pages/SkillPage'
import RubiksTimerPage from './pages/RubiksTimerPage'
import { supabase } from './lib/supabase'
import {
  fetchCategories,
  fetchSkills,
  fetchProgressEntries,
  createCategory,
  updateCategory as updateCategoryRow,
  deleteCategory as deleteCategoryRow,
  createSkill,
  updateSkill as updateSkillRow,
  deleteSkill as deleteSkillRow,
  createProgressEntry,
  updateProgressEntry as updateProgressEntryRow,
  deleteProgressEntry as deleteProgressEntryRow,
  deleteAllCategories,
  deleteAllSkills,
  deleteAllProgressEntries,
} from './lib/db'
import {
  formatDateInput,
  formatSolveTime,
  normalizeStoredTime,
  parseTimeToSeconds,
} from './lib/rubiks'

function stripUndefinedValues(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  )
}

function getDefaultActivityConfig(templateType) {
  switch (templateType) {
    case 'scramble_timer':
      return {
        name: 'Scramble + Timer',
        unit: 'sec',
        valueLabel: 'Solve Time',
        pbLabel: 'PB',
        higherIsBetter: false,
        notes: 'Generated 3x3 scrambles with timer tracking.',
      }

    case 'ao5_timer':
      return {
        name: 'Average of 5',
        unit: 'sec',
        valueLabel: 'Ao5 Result',
        pbLabel: 'Best Ao5',
        higherIsBetter: false,
        notes: 'Five-solve average session tracker.',
      }

    case 'regular_timer':
    default:
      return {
        name: 'Regular Timer',
        unit: 'sec',
        valueLabel: 'Solve Time',
        pbLabel: 'PB',
        higherIsBetter: false,
        notes: 'Standard hold-and-release solve timer.',
      }
  }
}

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  const [currentView, setCurrentView] = useState('home')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedSkillId, setSelectedSkillId] = useState(null)

  const [categories, setCategories] = useState([])
  const [skillsRaw, setSkillsRaw] = useState([])
  const [progressEntries, setProgressEntries] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error

        if (!mounted) return
        setCurrentUser(data.user ?? null)
      } catch (err) {
        console.error(err)
        if (mounted) {
          setError(err.message || 'Failed to get current user.')
        }
      } finally {
        if (mounted) {
          setAuthReady(true)
        }
      }
    }

    initAuth()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUser = session?.user ?? null
        setCurrentUser(nextUser)

        if (!nextUser) {
          setCategories([])
          setSkillsRaw([])
          setProgressEntries([])
          setSelectedCategoryId(null)
          setSelectedSkillId(null)
          setCurrentView('home')
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return
    loadAppData()
  }, [currentUser])

  async function loadAppData() {
    try {
      setLoading(true)
      setError('')

      const [categoriesData, skillsData, progressData] = await Promise.all([
        fetchCategories(),
        fetchSkills(),
        fetchProgressEntries(),
      ])

      setCategories(categoriesData)
      setSkillsRaw(skillsData)
      setProgressEntries(progressData)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  const skills = useMemo(() => {
    return skillsRaw.map((skill) => {
      const progress = progressEntries
        .filter((entry) => entry.skill_id === skill.id)
        .map((entry) => ({
          id: entry.id,
          date: entry.entry_date,
          value: entry.value,
          note: entry.note || '',
        }))

      return {
        id: skill.id,
        categoryId: skill.category_id,
        name: skill.name,
        pb: skill.pb,
        ranking: skill.ranking,
        unit: skill.unit || 'sec',
        valueLabel: skill.value_label || 'Solve Time',
        pbLabel: skill.pb_label || 'PB',
        higherIsBetter: skill.higher_is_better ?? false,
        image: skill.image || '',
        notes: skill.notes || '',
        lastUpdated: skill.last_updated,
        progress,
        templateType: skill.template_type || 'regular_timer',
        isPresetLocked: skill.is_preset_locked ?? true,
        goal: skill.goal ?? '',
      }
    })
  }, [skillsRaw, progressEntries])

  const selectedCategory = useMemo(() => {
    return categories.find((category) => category.id === selectedCategoryId) || null
  }, [categories, selectedCategoryId])

  const selectedSkill = useMemo(() => {
    return skills.find((skill) => skill.id === selectedSkillId) || null
  }, [skills, selectedSkillId])

  const categorySkills = useMemo(() => {
    return skills.filter((skill) => skill.categoryId === selectedCategoryId)
  }, [skills, selectedCategoryId])

  function openCategory(categoryId) {
    setSelectedCategoryId(categoryId)
    setCurrentView('category')
  }

  function openSkill(skillId) {
    setSelectedSkillId(skillId)
    setCurrentView('skill')
  }

  function openRubiksTimer() {
    setCurrentView('rubiksTimer')
  }

  function goHome() {
    setCurrentView('home')
    setSelectedCategoryId(null)
    setSelectedSkillId(null)
  }

  function goToCategory() {
    setCurrentView('category')
    setSelectedSkillId(null)
  }

  function goToSkill() {
    setCurrentView('skill')
  }

  function getRecalculatedPb(skill, progressList) {
    const numericEntries = progressList
      .map((entry) => ({
        raw: entry.value,
        seconds: parseTimeToSeconds(entry.value),
      }))
      .filter((entry) => entry.seconds !== null)

    if (numericEntries.length === 0) {
      return ''
    }

    let best = numericEntries[0]

    for (let i = 1; i < numericEntries.length; i += 1) {
      const current = numericEntries[i]

      if (skill.higherIsBetter) {
        if (current.seconds > best.seconds) {
          best = current
        }
      } else if (current.seconds < best.seconds) {
        best = current
      }
    }

    return normalizeStoredTime(best.raw)
  }

  async function addSkillEntry(skillId, entryData) {
    try {
      setSaving(true)
      setError('')

      const skill = skills.find((item) => item.id === skillId)
      if (!skill || !currentUser) return

      const normalizedValue = normalizeStoredTime(entryData.value)
      if (!normalizedValue) {
        throw new Error('Invalid solve time.')
      }

      const today = entryData.date || formatDateInput(new Date())
      const note = (entryData.note || '').trim()

      const newProgress = [
        {
          id: `temp-${Date.now()}`,
          date: today,
          value: normalizedValue,
          note,
        },
        ...skill.progress,
      ]

      const newPb = getRecalculatedPb(skill, newProgress)

      await createProgressEntry(
        {
          skill_id: skillId,
          entry_date: today,
          value: normalizedValue,
          note,
        },
        currentUser.id
      )

      await updateSkillRow(
        skillId,
        stripUndefinedValues({
          pb: newPb,
          last_updated: today,
        })
      )

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to save solve.')
    } finally {
      setSaving(false)
    }
  }

  async function updateSkill(skillId, updates) {
    try {
      setSaving(true)
      setError('')

      const existingSkill = skills.find((item) => item.id === skillId)
      if (!existingSkill) return

      await updateSkillRow(
        skillId,
        stripUndefinedValues({
          name: updates.name,
          notes: updates.notes,
          image: updates.image,
          goal: updates.goal,
          ranking: updates.ranking,
          value_label: updates.valueLabel,
          pb_label: updates.pbLabel,
        })
      )

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to update activity.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSkill(skillId) {
    try {
      setSaving(true)
      setError('')

      await deleteSkillRow(skillId)
      setCurrentView('category')
      setSelectedSkillId(null)
      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to delete activity.')
    } finally {
      setSaving(false)
    }
  }

  async function updateSkillEntry(skillId, entryId, updatedEntry) {
    try {
      setSaving(true)
      setError('')

      const skill = skills.find((item) => item.id === skillId)
      if (!skill) return

      const existingEntry = skill.progress.find((entry) => entry.id === entryId)
      if (!existingEntry) return

      await updateProgressEntryRow(entryId, {
        note: (updatedEntry.note || '').trim(),
      })

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to update solve note.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSkillEntry(skillId, entryId) {
    try {
      setSaving(true)
      setError('')

      const skill = skills.find((item) => item.id === skillId)
      if (!skill) return

      const updatedProgress = skill.progress.filter((entry) => entry.id !== entryId)
      const newPb = updatedProgress.length > 0 ? getRecalculatedPb(skill, updatedProgress) : ''
      const newLastUpdated = updatedProgress[0]?.date || null

      await deleteProgressEntryRow(entryId)

      await updateSkillRow(
        skillId,
        stripUndefinedValues({
          pb: newPb,
          last_updated: newLastUpdated,
        })
      )

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to delete solve.')
    } finally {
      setSaving(false)
    }
  }

  async function addNewCategory(newCategory) {
    try {
      setSaving(true)
      setError('')

      if (!currentUser) return

      await createCategory(
        {
          name: newCategory.name.trim(),
          image: (newCategory.image || '').trim(),
        },
        currentUser.id
      )

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create folder.')
    } finally {
      setSaving(false)
    }
  }

  async function updateCategory(categoryId, updates) {
    try {
      setSaving(true)
      setError('')

      await updateCategoryRow(
        categoryId,
        stripUndefinedValues({
          name: updates.name?.trim(),
          image: updates.image?.trim() || '',
        })
      )

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to update folder.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(categoryId) {
    const categoryToDelete = categories.find((category) => category.id === categoryId)
    const categorySkillsToDelete = skills.filter((skill) => skill.categoryId === categoryId)

    const confirmed = window.confirm(
      `Delete "${categoryToDelete?.name || 'this folder'}"? This will also delete ${categorySkillsToDelete.length} activit${categorySkillsToDelete.length === 1 ? 'y' : 'ies'}.`
    )

    if (!confirmed) return

    try {
      setSaving(true)
      setError('')

      await deleteCategoryRow(categoryId)

      if (selectedCategoryId === categoryId) {
        setCurrentView('home')
        setSelectedCategoryId(null)
        setSelectedSkillId(null)
      }

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to delete folder.')
    } finally {
      setSaving(false)
    }
  }

  function addPresetSkill(categoryId, templateType, overrides = {}) {
    const alreadyExists = skills.some(
      (skill) =>
        skill.categoryId === categoryId &&
        skill.templateType === templateType &&
        skill.name.toLowerCase() === (overrides.name || getDefaultActivityConfig(templateType).name).toLowerCase()
    )

    if (alreadyExists) {
      window.alert('An activity with that type and name already exists in this folder.')
      return
    }

    const defaults = getDefaultActivityConfig(templateType)

    addNewSkill({
      categoryId,
      name: overrides.name?.trim() || defaults.name,
      pb: '',
      ranking: '',
      unit: defaults.unit,
      valueLabel: defaults.valueLabel,
      pbLabel: defaults.pbLabel,
      higherIsBetter: defaults.higherIsBetter,
      image: overrides.image?.trim() || '',
      notes: overrides.notes?.trim() || defaults.notes,
      goal: overrides.goal?.trim() || '',
      lastUpdated: null,
      templateType,
      isPresetLocked: true,
    })
  }

  async function addNewSkill(newSkill) {
    try {
      setSaving(true)
      setError('')

      if (!currentUser) return

      await createSkill(
        {
          category_id: newSkill.categoryId,
          name: newSkill.name,
          pb: newSkill.pb || '',
          ranking: newSkill.ranking || '',
          unit: newSkill.unit || 'sec',
          value_label: newSkill.valueLabel || 'Solve Time',
          pb_label: newSkill.pbLabel || 'PB',
          higher_is_better: newSkill.higherIsBetter ?? false,
          image: newSkill.image || '',
          notes: newSkill.notes || '',
          last_updated: newSkill.lastUpdated || null,
          template_type: newSkill.templateType || 'regular_timer',
          is_preset_locked: !!newSkill.isPresetLocked,
          goal: newSkill.goal || '',
        },
        currentUser.id
      )

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create activity.')
    } finally {
      setSaving(false)
    }
  }

  async function resetAppData() {
    const confirmed = window.confirm('Delete all Q Rubix data?')
    if (!confirmed) return

    try {
      setSaving(true)
      setError('')

      await deleteAllProgressEntries()
      await deleteAllSkills()
      await deleteAllCategories()

      setCurrentView('home')
      setSelectedCategoryId(null)
      setSelectedSkillId(null)

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to reset app data.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    try {
      setSaving(true)
      setError('')
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to sign out.')
    } finally {
      setSaving(false)
    }
  }

  function OverlayChrome() {
    return (
      <>
        {error ? (
          <div className="floating-banner floating-banner-error">{error}</div>
        ) : null}

        {saving ? (
          <div className="floating-banner floating-banner-saving">Saving...</div>
        ) : null}

        <button
          type="button"
          onClick={handleSignOut}
          className="floating-signout"
        >
          Sign out
        </button>
      </>
    )
  }

  if (!authReady) {
    return (
      <div className="loading-screen">
        Checking auth...
      </div>
    )
  }

  if (!currentUser) {
    return <LoginPage />
  }

  if (loading) {
    return (
      <div className="loading-screen">
        Loading your cube data...
      </div>
    )
  }

  if (currentView === 'home') {
    return (
      <>
        <OverlayChrome />
        <HomePage
          categories={categories}
          skills={skills}
          onOpenCategory={openCategory}
          onResetSkills={resetAppData}
          onAddNewCategory={addNewCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
        />
      </>
    )
  }

  if (currentView === 'category' && selectedCategory) {
    return (
      <>
        <OverlayChrome />
        <CategoryPage
          category={selectedCategory}
          skills={categorySkills}
          onBack={goHome}
          onOpenSkill={openSkill}
          onAddPresetSkill={addPresetSkill}
        />
      </>
    )
  }

  if (currentView === 'skill' && selectedSkill) {
    return (
      <>
        <OverlayChrome />
        <SkillPage
          skill={selectedSkill}
          onBack={goToCategory}
          onUpdateSkill={updateSkill}
          onDeleteSkill={deleteSkill}
          onUpdateSkillEntry={updateSkillEntry}
          onDeleteSkillEntry={deleteSkillEntry}
          onOpenRubiksTimer={openRubiksTimer}
        />
      </>
    )
  }

  if (currentView === 'rubiksTimer' && selectedSkill) {
    return (
      <>
        <OverlayChrome />
        <RubiksTimerPage
          skill={selectedSkill}
          onBack={goToSkill}
          onSaveSolve={(solveData) => addSkillEntry(selectedSkill.id, solveData)}
          onUpdateSkill={(updates) => updateSkill(selectedSkill.id, updates)}
        />
      </>
    )
  }

  return null
}