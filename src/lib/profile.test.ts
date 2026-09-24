import { describe, expect, it } from 'vitest'
import {
  mapProfileUpdateError,
  messageTextClass,
  MESSAGE_TEXT_COLORS,
  PROFILE_DISPLAY_NAME_MAX,
  PROFILE_MESSAGE_MAX,
  validateDisplayName,
  validateProfileMessage,
} from './profile'

describe('profile validation', () => {
  it('accepts a trimmed non-empty display name', () => {
    expect(validateDisplayName('  Anna  ')).toBeNull()
  })

  it('rejects empty, newline, and over-length display names', () => {
    expect(validateDisplayName('   ')).toContain('Inserisci un nome')
    expect(validateDisplayName('An\nna')).toContain('a capo')
    expect(validateDisplayName('a'.repeat(PROFILE_DISPLAY_NAME_MAX + 1))).toContain(
      `Massimo ${PROFILE_DISPLAY_NAME_MAX}`,
    )
  })

  it('accepts messages up to the persisted limit and rejects longer ones', () => {
    expect(validateProfileMessage('a'.repeat(PROFILE_MESSAGE_MAX))).toBeNull()
    expect(validateProfileMessage('a'.repeat(PROFILE_MESSAGE_MAX + 1))).toContain('messaggio')
  })
})

describe('message colors', () => {
  it('maps each curated color to a theme class', () => {
    expect(messageTextClass(MESSAGE_TEXT_COLORS.CORAL)).toBe('text-primary')
    expect(messageTextClass(MESSAGE_TEXT_COLORS.BLUE)).toContain('text-blue-700')
  })

  it('falls back to ink for an unknown stored color', () => {
    expect(messageTextClass('not-a-color')).toBe('text-base-content')
  })
})

describe('duplicate-name error mapping', () => {
  it('maps the unique violation to a duplicate-name message', () => {
    const error = { code: '23505', message: 'duplicate key' } as never
    expect(mapProfileUpdateError(error)).toContain('già in uso')
  })

  it('maps anything else to the generic failure', () => {
    expect(mapProfileUpdateError(null)).toContain('salvare il profilo')
    expect(mapProfileUpdateError({ code: '23514', message: 'check' } as never)).toContain(
      'salvare il profilo',
    )
  })
})
