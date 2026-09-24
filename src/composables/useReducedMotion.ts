import { onScopeDispose, ref } from 'vue'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Tracks the `prefers-reduced-motion` media query. When the environment has no
 * `matchMedia` support, motion is treated as allowed so behavior degrades to
 * the standard animated variant.
 */
export function useReducedMotion() {
  const prefersReducedMotion = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return prefersReducedMotion
  }

  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  prefersReducedMotion.value = query.matches

  const update = (event: MediaQueryListEvent) => {
    prefersReducedMotion.value = event.matches
  }

  query.addEventListener('change', update)
  onScopeDispose(() => query.removeEventListener('change', update))

  return prefersReducedMotion
}
