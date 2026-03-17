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

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
    })

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
          note: entry.note,
        }))

      return {
        id: skill.id,
        categoryId: skill.category_id,
        name: skill.name,
        pb: skill.pb,
        ranking: skill.ranking,
        unit: skill.unit,
        valueLabel: skill.value_label,
        pbLabel: skill.pb_label,
        higherIsBetter: skill.higher_is_better,
        image: skill.image,
        notes: skill.notes,
        lastUpdated: skill.last_updated,
        progress,
        templateType: skill.template_type,
        isPresetLocked: skill.is_preset_locked,
      }
    })
  }, [skillsRaw, progressEntries])

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId)
  }, [categories, selectedCategoryId])

  const selectedSkill = useMemo(() => {
    return skills.find((s) => s.id === selectedSkillId)
  }, [skills, selectedSkillId])

  const categorySkills = useMemo(() => {
    return skills.filter((s) => s.categoryId === selectedCategoryId)
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

  function cleanEntryValue(rawValue, unit) {
    if (!rawValue) return ''

    let cleaned = rawValue.trim()

    if (unit) {
      const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const unitRegex = new RegExp(`\\s*${escapedUnit}\\s*$`, 'i')
      cleaned = cleaned.replace(unitRegex, '')
    }

    return cleaned.trim()
  }

  function getRecalculatedPb(skill, progressList) {
    const numericEntries = progressList
      .map((entry) => ({
        raw: entry.value,
        num: parseFloat(entry.value),
      }))
      .filter((entry) => !Number.isNaN(entry.num))

    if (numericEntries.length === 0) {
      return skill.pb || ''
    }

    if (skill.higherIsBetter === false) {
      let best = numericEntries[0]
      for (let i = 1; i < numericEntries.length; i++) {
        if (numericEntries[i].num < best.num) {
          best = numericEntries[i]
        }
      }
      return best.raw
    }

    let best = numericEntries[0]
    for (let i = 1; i < numericEntries.length; i++) {
      if (numericEntries[i].num > best.num) {
        best = numericEntries[i]
      }
    }
    return best.raw
  }

  async function addSkillEntry(skillId, entryData) {
    try {
      setSaving(true)
      setError('')

      const skill = skills.find((s) => s.id === skillId)
      if (!skill || !currentUser) return

      const cleanedValue = cleanEntryValue(entryData.value, skill.unit)

      const newProgress = [
        {
          id: 'temp',
          date: entryData.date,
          value: cleanedValue,
          note: entryData.note,
        },
        ...skill.progress,
      ]

      const newPb = getRecalculatedPb(skill, newProgress)

      await createProgressEntry(
        {
          skill_id: skillId,
          entry_date: entryData.date,
          value: cleanedValue,
          note: entryData.note,
        },
        currentUser.id
      )

      await updateSkillRow(skillId, {
        pb: newPb,
        last_updated: entryData.date,
      })

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to add entry.')
    } finally {
      setSaving(false)
    }
  }

  async function updateSkill(skillId, updates) {
    try {
      setSaving(true)
      setError('')

      await updateSkillRow(skillId, {
        notes: updates.notes,
        ranking: updates.ranking,
        image: updates.image,
      })

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to update skill.')
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
      setError(err.message || 'Failed to delete skill.')
    } finally {
      setSaving(false)
    }
  }

  async function updateSkillEntry(skillId, entryId, updatedEntry) {
    try {
      setSaving(true)
      setError('')

      const skill = skills.find((s) => s.id === skillId)
      if (!skill) return

      const cleanedValue = cleanEntryValue(updatedEntry.value, skill.unit)

      const updatedProgress = skill.progress.map((entry) => {
        if (entry.id !== entryId) return entry
        return {
          ...entry,
          date: updatedEntry.date,
          value: cleanedValue,
          note: updatedEntry.note,
        }
      })

      const newPb = getRecalculatedPb(skill, updatedProgress)

      await updateProgressEntryRow(entryId, {
        entry_date: updatedEntry.date,
        value: cleanedValue,
        note: updatedEntry.note,
      })

      await updateSkillRow(skillId, {
        pb: newPb,
        last_updated: updatedEntry.date,
      })

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to update progress entry.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSkillEntry(skillId, entryId) {
    try {
      setSaving(true)
      setError('')

      const skill = skills.find((s) => s.id === skillId)
      if (!skill) return

      const updatedProgress = skill.progress.filter((entry) => entry.id !== entryId)
      const newPb = updatedProgress.length > 0 ? getRecalculatedPb(skill, updatedProgress) : ''
      const newLastUpdated = updatedProgress[0]?.date || null

      await deleteProgressEntryRow(entryId)

      await updateSkillRow(skillId, {
        pb: newPb,
        last_updated: newLastUpdated,
      })

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to delete progress entry.')
    } finally {
      setSaving(false)
    }
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
          unit: newSkill.unit || '',
          value_label: newSkill.valueLabel || 'Value',
          pb_label: newSkill.pbLabel || 'PB',
          higher_is_better: newSkill.higherIsBetter,
          image: newSkill.image || '',
          notes: newSkill.notes || '',
          last_updated: newSkill.lastUpdated || null,
          template_type: newSkill.templateType || '',
          is_preset_locked: !!newSkill.isPresetLocked,
        },
        currentUser.id
      )

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create skill.')
    } finally {
      setSaving(false)
    }
  }

  function addPresetSkill(categoryId, presetKey) {
    if (presetKey === 'rubiks_timer') {
      const alreadyExists = skills.some(
        (skill) =>
          skill.categoryId === categoryId && skill.templateType === 'rubiks_timer'
      )

      if (alreadyExists) {
        window.alert("Rubik's Solving already exists in this category.")
        return
      }

      addNewSkill({
        categoryId,
        name: "Rubik's Solving",
        pb: '',
        ranking: '—',
        unit: 'sec',
        valueLabel: 'Solve Time',
        pbLabel: 'Best Solve',
        higherIsBetter: false,
        image: '',
        notes: "Preset timer skill for Rubik's solves.",
        lastUpdated: new Date().toISOString().split('T')[0],
        templateType: 'rubiks_timer',
        isPresetLocked: true,
      })
    }
  }

  async function addNewCategory(newCategory) {
    try {
      setSaving(true)
      setError('')

      if (!currentUser) return

      await createCategory(
        {
          name: newCategory.name,
          image: newCategory.image || '',
        },
        currentUser.id
      )

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create category.')
    } finally {
      setSaving(false)
    }
  }

  async function updateCategory(categoryId, updates) {
    try {
      setSaving(true)
      setError('')

      await updateCategoryRow(categoryId, {
        name: updates.name,
        image: updates.image || '',
      })

      await loadAppData()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to update category.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(categoryId) {
    const categoryToDelete = categories.find((category) => category.id === categoryId)
    const categorySkillsToDelete = skills.filter((skill) => skill.categoryId === categoryId)

    const confirmed = window.confirm(
      `Delete "${categoryToDelete?.name || 'this category'}"? This will also delete ${categorySkillsToDelete.length} skill(s) inside it.`
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
      setError(err.message || 'Failed to delete category.')
    } finally {
      setSaving(false)
    }
  }

  async function resetAppData() {
    const confirmed = window.confirm('Delete all your app data?')
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
          <div
            style={{
              position: 'fixed',
              top: 12,
              left: 12,
              right: 12,
              zIndex: 9999,
              background: '#7f1d1d',
              color: 'white',
              padding: '10px 12px',
              borderRadius: '10px',
            }}
          >
            {error}
          </div>
        ) : null}

        {saving ? (
          <div
            style={{
              position: 'fixed',
              bottom: 12,
              right: 12,
              zIndex: 9999,
              background: '#0f172a',
              color: 'white',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            Saving...
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSignOut}
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 9999,
            border: 'none',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            padding: '10px 14px',
            fontWeight: 800,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          Sign out
        </button>
      </>
    )
  }

  if (!authReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0b1220',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Checking auth...
      </div>
    )
  }

  if (!currentUser) {
    return <LoginPage />
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0b1220',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading your data...
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
          onAddNewSkill={addNewSkill}
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
          onAddEntry={addSkillEntry}
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
        />
      </>
    )
  }

  return null
}