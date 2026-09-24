import type { PostgrestError } from '@supabase/supabase-js'

/** Shared profile limits. Mirrors the database check constraints. */
export const PROFILE_DISPLAY_NAME_MAX = 30
export const PROFILE_MESSAGE_MAX = 140

/** The only message text colors a profile may store. Mirrors the DB palette. */
export const MESSAGE_TEXT_COLORS = {
  INK: 'ink',
  CORAL: 'coral',
  TEAL: 'teal',
  VIOLET: 'violet',
  BLUE: 'blue',
} as const

export type MessageTextColor = (typeof MESSAGE_TEXT_COLORS)[keyof typeof MESSAGE_TEXT_COLORS]

export const MESSAGE_TEXT_PALETTE: readonly MessageTextColor[] = Object.values(MESSAGE_TEXT_COLORS)

/**
 * Theme classes for each stored message color. Color is never the only signal:
 * messages stay plain text with sufficient contrast in both light and dark modes.
 */
export const MESSAGE_TEXT_CLASSES: Record<MessageTextColor, string> = {
  ink: 'text-base-content',
  coral: 'text-primary',
  teal: 'text-secondary',
  violet: 'text-violet-700 dark:text-violet-300',
  blue: 'text-blue-700 dark:text-blue-300',
}

export function isMessageTextColor(value: unknown): value is MessageTextColor {
  return typeof value === 'string' && (MESSAGE_TEXT_PALETTE as readonly string[]).includes(value)
}

/** Maps a stored color to its theme class, falling back to the ink token. */
export function messageTextClass(value: unknown): string {
  return MESSAGE_TEXT_CLASSES[isMessageTextColor(value) ? value : MESSAGE_TEXT_COLORS.INK]
}

export const PROFILE_ERRORS = {
  DUPLICATE_NAME: 'Questo nome è già in uso.',
  CONNECTION: 'Connessione non disponibile. Riprova.',
  UNKNOWN: 'Non è stato possibile salvare il profilo.',
  LOAD: 'Non è stato possibile caricare il profilo.',
  SESSION: 'Sessione non disponibile. Accedi nuovamente.',
} as const

/** Immediate field feedback that prevents avoidable requests. */
export function validateDisplayName(value: string): string | null {
  const name = value.trim()
  if (!name) return 'Inserisci un nome.'
  if (/[\r\n]/.test(value)) return 'Il nome non può contenere a capo.'
  if (name.length > PROFILE_DISPLAY_NAME_MAX)
    return `Massimo ${PROFILE_DISPLAY_NAME_MAX} caratteri.`
  return null
}

export function validateProfileMessage(value: string): string | null {
  return value.trim().length > PROFILE_MESSAGE_MAX
    ? `Il messaggio può avere al massimo ${PROFILE_MESSAGE_MAX} caratteri.`
    : null
}

/** Turns database failures into stable, non-technical user categories. */
export function mapProfileUpdateError(error: PostgrestError | null): string {
  if (!error) return PROFILE_ERRORS.UNKNOWN
  return error.code === '23505' ? PROFILE_ERRORS.DUPLICATE_NAME : PROFILE_ERRORS.UNKNOWN
}
