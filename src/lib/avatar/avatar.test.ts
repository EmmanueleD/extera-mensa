import { describe, expect, it } from 'vitest'
import {
  AVATAR_COLORS,
  AVATAR_FILL_TOKENS,
  AVATAR_PALETTE,
  createAvatarRecipe,
  isAvatarColor,
  regenerateAvatarSeed,
  resolveAvatarColor,
} from './avatar'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('avatar palette safety', () => {
  it('maps every curated color to a theme token and nothing else', () => {
    expect(Object.keys(AVATAR_FILL_TOKENS).sort()).toEqual([...AVATAR_PALETTE].sort())
    for (const token of Object.values(AVATAR_FILL_TOKENS)) {
      expect(token.startsWith('var(--avatar-')).toBe(true)
    }
  })

  it('rejects unknown colors and falls back to a curated one', () => {
    expect(isAvatarColor('chartreuse')).toBe(false)
    expect(isAvatarColor('#ff00ff')).toBe(false)
    expect(resolveAvatarColor('chartreuse')).toBe(AVATAR_COLORS.CORAL)
    expect(createAvatarRecipe('seed-anna', '#ff00ff').color).toBe(AVATAR_COLORS.CORAL)
  })
})

describe('avatar determinism', () => {
  it('produces identical recipes for the same seed and color', () => {
    const first = createAvatarRecipe('seed-anna', AVATAR_COLORS.TEAL)
    const second = createAvatarRecipe('seed-anna', AVATAR_COLORS.TEAL)
    expect(second).toEqual(first)
  })

  it('produces different geometry for different seeds', () => {
    const anna = createAvatarRecipe('seed-anna', AVATAR_COLORS.TEAL)
    const luca = createAvatarRecipe('seed-luca', AVATAR_COLORS.TEAL)
    expect(luca.geometry).not.toEqual(anna.geometry)
  })
})

describe('avatar regeneration', () => {
  it('creates a fresh uuid seed each time', () => {
    const first = regenerateAvatarSeed()
    const second = regenerateAvatarSeed()
    expect(first).toMatch(UUID_V4)
    expect(second).toMatch(UUID_V4)
    expect(second).not.toBe(first)
  })

  it('renders a different recipe after regeneration while keeping the color', () => {
    const previous = createAvatarRecipe(regenerateAvatarSeed(), AVATAR_COLORS.BLUE)
    const next = createAvatarRecipe(regenerateAvatarSeed(), AVATAR_COLORS.BLUE)
    expect(next.color).toBe(AVATAR_COLORS.BLUE)
    expect(next.geometry).not.toEqual(previous.geometry)
  })
})
