/**
 * Deterministic, dependency-free organic avatar generator.
 *
 * A persisted UUID seed is hashed into a seeded PRNG that selects compatible
 * organic path variants and facial parameters. The generated markup is entirely
 * Vue-owned SVG built from numbers, so no user-provided SVG, path, HTML, or
 * arbitrary color ever reaches the DOM.
 */

export const AVATAR_COLORS = {
  CORAL: 'coral',
  TEAL: 'teal',
  SUN: 'sun',
  VIOLET: 'violet',
  BLUE: 'blue',
  PINK: 'pink',
} as const

export type AvatarColor = (typeof AVATAR_COLORS)[keyof typeof AVATAR_COLORS]

/** The only colors an avatar may use. Mirrors the database palette constraint. */
export const AVATAR_PALETTE: readonly AvatarColor[] = Object.values(AVATAR_COLORS)

/**
 * Curated theme tokens for each palette color. SVG fills cannot use Tailwind
 * classes, so they reference these custom properties declared in style.css.
 * This keeps light/dark surfaces and hex values out of the component.
 */
export const AVATAR_FILL_TOKENS: Record<AvatarColor, string> = {
  coral: 'var(--avatar-coral)',
  teal: 'var(--avatar-teal)',
  sun: 'var(--avatar-sun)',
  violet: 'var(--avatar-violet)',
  blue: 'var(--avatar-blue)',
  pink: 'var(--avatar-pink)',
}

const DEFAULT_AVATAR_COLOR: AvatarColor = AVATAR_COLORS.CORAL

export function isAvatarColor(value: unknown): value is AvatarColor {
  return typeof value === 'string' && (AVATAR_PALETTE as readonly string[]).includes(value)
}

export function resolveAvatarColor(value: unknown): AvatarColor {
  return isAvatarColor(value) ? value : DEFAULT_AVATAR_COLOR
}

/** FNV-1a hash of the persisted seed into an unsigned 32-bit integer. */
export function hashSeed(seed: string): number {
  let hash = 2166136261 >>> 0
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Deterministic mulberry32 PRNG in the range [0, 1). */
export function createPrng(seed: string): () => number {
  let state = hashSeed(seed) || 0x9e3779b9
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const AVATAR_VARIANTS = {
  PEBBLE: 'pebble',
  LEAF: 'leaf',
  BLOOM: 'bloom',
} as const

export type AvatarVariant = (typeof AVATAR_VARIANTS)[keyof typeof AVATAR_VARIANTS]

const AVATAR_VARIANT_LIST: readonly AvatarVariant[] = Object.values(AVATAR_VARIANTS)

interface VariantShape {
  lobes: number
  base: number
  spread: number
  squash: number
}

const VARIANT_SHAPES: Record<AvatarVariant, VariantShape> = {
  pebble: { lobes: 6, base: 30, spread: 5, squash: 1 },
  leaf: { lobes: 5, base: 31, spread: 6, squash: 1.08 },
  bloom: { lobes: 7, base: 29, spread: 7, squash: 0.94 },
}

export interface AvatarPoint {
  x: number
  y: number
}

export interface AvatarEye {
  cx: number
  cy: number
  r: number
}

export interface AvatarGeometry {
  silhouette: string
  highlight: string
  eyes: AvatarEye[]
  mouth: string
  accent: AvatarEye | null
  tilt: number
}

export interface AvatarRecipe {
  seed: string
  color: AvatarColor
  variant: AvatarVariant
  geometry: AvatarGeometry
}

function round(value: number): string {
  return value.toFixed(2)
}

/** Closed Catmull-Rom curve rendered as cubic Bezier segments. */
function closedCurve(points: readonly AvatarPoint[]): string {
  const count = points.length
  const start = points[0]
  let path = `M ${round(start.x)} ${round(start.y)}`
  for (let index = 0; index < count; index += 1) {
    const previous = points[(index - 1 + count) % count]
    const current = points[index]
    const next = points[(index + 1) % count]
    const afterNext = points[(index + 2) % count]
    const c1x = current.x + (next.x - previous.x) / 6
    const c1y = current.y + (next.y - previous.y) / 6
    const c2x = next.x - (afterNext.x - current.x) / 6
    const c2y = next.y - (afterNext.y - current.y) / 6
    path += ` C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(next.x)} ${round(next.y)}`
  }
  return `${path} Z`
}

function buildBlob(
  random: () => number,
  lobes: number,
  base: number,
  spread: number,
  squash: number,
  centerX = 50,
  centerY = 50,
): string {
  const points: AvatarPoint[] = []
  for (let index = 0; index < lobes; index += 1) {
    const angle = (index / lobes) * Math.PI * 2 - Math.PI / 2
    const radius = base + random() * spread
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius * squash,
    })
  }
  return closedCurve(points)
}

function buildGeometry(random: () => number, variant: AvatarVariant): AvatarGeometry {
  const shape = VARIANT_SHAPES[variant]
  const silhouette = buildBlob(random, shape.lobes, shape.base, shape.spread, shape.squash)
  const highlight = buildBlob(random, 5, 9 + random() * 3, 2.5, 1, 37, 34)

  const eyeOffset = 11 + random() * 5
  const eyeY = 45 + random() * 5
  const eyeRadius = 3.4 + random() * 2.2
  const eyes: AvatarEye[] = [
    { cx: 50 - eyeOffset, cy: eyeY, r: eyeRadius },
    { cx: 50 + eyeOffset, cy: eyeY + (random() - 0.5) * 2, r: eyeRadius + (random() - 0.5) * 0.8 },
  ]

  const mouthWidth = 8 + random() * 6
  const mouthY = 60 + random() * 5
  const mouthLift = 4 + random() * 4
  const mouth = [
    `M ${round(50 - mouthWidth)} ${round(mouthY)}`,
    `Q 50 ${round(mouthY + mouthLift)}`,
    `${round(50 + mouthWidth)} ${round(mouthY)}`,
  ].join(' ')

  const accent: AvatarEye | null =
    variant === AVATAR_VARIANTS.BLOOM
      ? { cx: 68 + (random() - 0.5) * 6, cy: 28 + (random() - 0.5) * 6, r: 3 + random() * 2.5 }
      : null

  return { silhouette, highlight, eyes, mouth, accent, tilt: random() * 24 - 12 }
}

/** Builds the stable recipe for a seed and stored palette color. */
export function createAvatarRecipe(seed: string, color: unknown): AvatarRecipe {
  const normalizedSeed = seed.trim() || 'seedless'
  const random = createPrng(normalizedSeed)
  const variant = AVATAR_VARIANT_LIST[Math.floor(random() * AVATAR_VARIANT_LIST.length)]
  return {
    seed: normalizedSeed,
    color: resolveAvatarColor(color),
    variant,
    geometry: buildGeometry(random, variant),
  }
}

/**
 * Creates a fresh persistent seed for regeneration. Colors are intentionally
 * retained by the caller so only the organic shape changes.
 */
export function regenerateAvatarSeed(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}
