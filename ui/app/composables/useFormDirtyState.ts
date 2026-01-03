import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'

/**
 * Composable for tracking form dirty state (unsaved changes)
 * 
 * @param formData - Reactive form data object
 * @param options - Configuration options
 * @returns Object with dirty state tracking utilities
 */
export function useFormDirtyState<T extends Record<string, any>>(
  formData: T,
  options: {
    /** Enable browser warning when leaving page with unsaved changes */
    enableBeforeUnload?: boolean
    /** Custom comparison function for dirty state detection */
    compareFn?: (original: T, current: T) => boolean
  } = {}
) {
  const { enableBeforeUnload = true, compareFn } = options

  // Store original form data as JSON string for comparison
  const originalDataJson = ref<string>('')
  const isInitialized = ref(false)

  /**
   * Save current form state as the "clean" baseline
   */
  function saveOriginalState() {
    originalDataJson.value = JSON.stringify(formData)
    isInitialized.value = true
  }

  /**
   * Reset form to original saved state
   */
  function resetToOriginal() {
    if (!isInitialized.value) return

    try {
      const original = JSON.parse(originalDataJson.value)
      Object.keys(original).forEach((key) => {
        if (key in formData) {
          ;(formData as any)[key] = original[key]
        }
      })
    } catch (error) {
      console.error('Failed to reset form data:', error)
    }
  }

  /**
   * Check if form has unsaved changes
   */
  const isDirty = computed(() => {
    if (!isInitialized.value) return false

    if (compareFn) {
      try {
        const original = JSON.parse(originalDataJson.value)
        return compareFn(original, formData)
      } catch {
        return false
      }
    }

    const currentJson = JSON.stringify(formData)
    return currentJson !== originalDataJson.value
  })

  /**
   * Browser beforeunload handler to warn about unsaved changes
   */
  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (isDirty.value) {
      e.preventDefault()
      // Modern browsers ignore custom messages, but setting returnValue is required
      e.returnValue = ''
      return ''
    }
  }

  // Setup beforeunload listener
  if (enableBeforeUnload && typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })
  }

  return {
    /** Whether the form has unsaved changes */
    isDirty,
    /** Whether the form state has been initialized */
    isInitialized,
    /** Save current form state as clean baseline */
    saveOriginalState,
    /** Reset form to last saved state */
    resetToOriginal,
  }
}
