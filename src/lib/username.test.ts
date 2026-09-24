import { describe, expect, it } from 'vitest'
import {
  loginIdentifierToEmail,
  normalizeUsername,
  usernameToEmail,
  validateUsername,
} from './username'

describe('username', () => {
  it('normalizes by trimming and lowercasing', () => {
    expect(normalizeUsername('  Anna.Rossi ')).toBe('anna.rossi')
  })

  it('accepts valid usernames after normalization', () => {
    expect(validateUsername(' Anna_R-1.x ')).toBeNull()
    expect(validateUsername('abc')).toBeNull()
    expect(validateUsername('a'.repeat(30))).toBeNull()
  })

  it('rejects usernames with invalid length', () => {
    expect(validateUsername('ab')).toContain('tra 3 e 30')
    expect(validateUsername('a'.repeat(31))).toContain('tra 3 e 30')
    expect(validateUsername('   ')).toContain('tra 3 e 30')
  })

  it('rejects usernames with invalid characters', () => {
    expect(validateUsername('anna rossi')).toContain('solo lettere')
    expect(validateUsername('anna@x')).toContain('solo lettere')
    expect(validateUsername('annà')).toContain('solo lettere')
  })

  it('maps a username to the synthetic email', () => {
    expect(usernameToEmail(' Anna ')).toBe('anna@users.ext-mensa.it')
  })

  it('keeps legacy emails unchanged at login', () => {
    expect(loginIdentifierToEmail('Anna@Example.test')).toBe('Anna@Example.test')
    expect(loginIdentifierToEmail('Anna')).toBe('anna@users.ext-mensa.it')
  })
})
