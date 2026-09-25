import { describe, expect, it } from 'vitest'
import {
  AVATAR_COLORS,
  AVATAR_DECORATIONS,
  AVATAR_FILL_TOKENS,
  AVATAR_PALETTE,
  AVATAR_VARIANTS,
  createAvatarRecipe,
  isAvatarColor,
  regenerateAvatarSeed,
  resolveAvatarColor,
} from './avatar'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const representativeRecipes = Array.from({ length: 96 }, (_, index) =>
  createAvatarRecipe(`representative-seed-${index}`, AVATAR_COLORS.TEAL),
)

function pathNumbers(path: string): number[] {
  return [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map(([value]) => Number(value))
}

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

  it('covers distinct silhouettes, scales, spots, and optional decorations', () => {
    expect(new Set(representativeRecipes.map(({ variant }) => variant))).toEqual(
      new Set(Object.values(AVATAR_VARIANTS)),
    )
    expect(
      new Set(representativeRecipes.map(({ geometry }) => geometry.scale)).size,
    ).toBeGreaterThan(24)
    expect(representativeRecipes.some(({ geometry }) => geometry.spots.length === 0)).toBe(true)
    expect(representativeRecipes.some(({ geometry }) => geometry.spots.length > 0)).toBe(true)

    const decorations = new Set(
      representativeRecipes.map(({ geometry }) => geometry.decoration?.kind ?? 'none'),
    )
    expect(decorations).toEqual(new Set(['none', ...Object.values(AVATAR_DECORATIONS)]))
  })

  it('keeps generated geometry finite and safely inside the SVG viewBox', () => {
    for (const { geometry } of representativeRecipes) {
      expect(geometry.scale).toBeGreaterThanOrEqual(0.88)
      expect(geometry.scale).toBeLessThanOrEqual(1)

      for (const path of [geometry.silhouette, geometry.highlight, geometry.mouth]) {
        expect(pathNumbers(path).every((value) => value >= 0 && value <= 100)).toBe(true)
      }
      if (geometry.decoration?.path) {
        expect(
          pathNumbers(geometry.decoration.path).every((value) => value >= 0 && value <= 100),
        ).toBe(true)
      }

      const circles = [...geometry.eyes, ...geometry.spots, ...(geometry.decoration?.marks ?? [])]
      for (const { cx, cy, r } of circles) {
        expect([cx, cy, r].every(Number.isFinite)).toBe(true)
        expect(cx - r).toBeGreaterThanOrEqual(0)
        expect(cx + r).toBeLessThanOrEqual(100)
        expect(cy - r).toBeGreaterThanOrEqual(0)
        expect(cy + r).toBeLessThanOrEqual(100)
      }
    }
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
