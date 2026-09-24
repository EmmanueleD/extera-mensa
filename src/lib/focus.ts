/**
 * Focus helpers for overlay surfaces.
 *
 * Kept in a TypeScript module so DOM globals stay out of single-file components,
 * where the shared ESLint configuration does not declare browser globals.
 */

export function captureFocus(): HTMLElement | null {
  return typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null)
}

export function restoreFocus(element: HTMLElement | null): void {
  element?.focus()
}

export function focusField(element: HTMLElement | null): void {
  element?.focus()
}
