import { computed } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Composable for unified navigation behavior
 * Provides consistent "back" button functionality that works both
 * for browser back button and interface back buttons
 */
export function useNavigation() {
  const router = useRouter()

  /**
   * Check if there's navigation history available
   * Returns true if user can go back in browser history
   */
  const canGoBack = computed(() => {
    // Check if there's a previous page in the current session
    // window.history.state.back will be null if this is the first page
    return window.history.state?.back !== null && window.history.state?.back !== undefined
  })

  /**
   * Navigate back in history
   * Uses browser's back functionality which works with both
   * browser back button and interface back buttons
   */
  function goBack() {
    if (canGoBack.value) {
      router.back()
    }
  }

  return {
    canGoBack,
    goBack
  }
}
