import { supabase } from './supabase'

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function fetchSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function fetchProgressEntries() {
  const { data, error } = await supabase
    .from('progress_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createCategory(category, ownerUserId) {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      ...category,
      owner_user_id: ownerUserId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(categoryId, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(categoryId) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) throw error
}

export async function createSkill(skill, ownerUserId) {
  const { data, error } = await supabase
    .from('skills')
    .insert({
      ...skill,
      owner_user_id: ownerUserId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSkill(skillId, updates) {
  const { data, error } = await supabase
    .from('skills')
    .update(updates)
    .eq('id', skillId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSkill(skillId) {
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', skillId)

  if (error) throw error
}

export async function createProgressEntry(entry, ownerUserId) {
  const { data, error } = await supabase
    .from('progress_entries')
    .insert({
      ...entry,
      owner_user_id: ownerUserId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProgressEntry(entryId, updates) {
  const { data, error } = await supabase
    .from('progress_entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProgressEntry(entryId) {
  const { error } = await supabase
    .from('progress_entries')
    .delete()
    .eq('id', entryId)

  if (error) throw error
}

export async function deleteAllCategories() {
  const { error } = await supabase.from('categories').delete().not('id', 'is', null)
  if (error) throw error
}

export async function deleteAllSkills() {
  const { error } = await supabase.from('skills').delete().not('id', 'is', null)
  if (error) throw error
}

export async function deleteAllProgressEntries() {
  const { error } = await supabase.from('progress_entries').delete().not('id', 'is', null)
  if (error) throw error
}