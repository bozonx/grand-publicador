import { ref } from 'vue'

interface DirtyForm {
  id: string
  isDirty: () => boolean
  message: string
}

// Global registry of dirty forms
const dirtyForms = ref<Map<string, DirtyForm>>(new Map())

// Global flag to prevent multiple confirms
let isConfirming = false

/**
 * Register a form that can be dirty
 */
export function registerDirtyForm(id: string, isDirty: () => boolean, message: string) {
  dirtyForms.value.set(id, { id, isDirty, message })
  
  return () => {
    dirtyForms.value.delete(id)
  }
}

/**
 * Check if any registered form is dirty
 */
export function hasAnyDirtyForm(): DirtyForm | null {
  for (const form of dirtyForms.value.values()) {
    if (form.isDirty()) {
      return form
    }
  }
  return null
}

/**
 * Show confirmation dialog for dirty forms
 * Returns true if user wants to proceed, false otherwise
 */
export function confirmLeaveDirtyForm(message?: string): boolean {
  if (isConfirming) {
    return true // Prevent nested confirms
  }
  
  const dirtyForm = hasAnyDirtyForm()
  if (!dirtyForm) {
    return true
  }
  
  isConfirming = true
  const result = window.confirm(message || dirtyForm.message)
  isConfirming = false
  
  return result
}
