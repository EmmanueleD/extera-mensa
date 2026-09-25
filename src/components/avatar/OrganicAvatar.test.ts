import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AVATAR_DECORATIONS, createAvatarRecipe } from '../../lib/avatar/avatar'
import OrganicAvatar from './OrganicAvatar.vue'

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

function seedMatching(
  predicate: (recipe: ReturnType<typeof createAvatarRecipe>) => boolean,
): string {
  for (let index = 0; index < 256; index += 1) {
    const seed = `component-seed-${index}`
    if (predicate(createAvatarRecipe(seed, 'teal'))) return seed
  }
  throw new Error('No representative avatar seed found')
}

describe('OrganicAvatar', () => {
  it('labels the avatar for assistive technology when a name is provided', () => {
    const wrapper = mount(OrganicAvatar, {
      props: { seed: 'seed-anna', color: 'coral', label: 'Avatar di Anna' },
    })

    const svg = wrapper.get('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Avatar di Anna')
    expect(svg.attributes('aria-hidden')).toBeUndefined()
  })

  it('stays decorative when no label is provided', () => {
    const wrapper = mount(OrganicAvatar, { props: { seed: 'seed-anna', color: 'coral' } })
    const svg = wrapper.get('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('role')).toBeUndefined()
  })

  it('renders deterministic, palette-safe markup for the same props', () => {
    const options = { props: { seed: 'seed-luca', color: 'violet' } }
    const first = mount(OrganicAvatar, options).html()
    const second = mount(OrganicAvatar, options).html()

    expect(first).toBe(second)
    expect(first).toContain('var(--avatar-violet)')
    expect(first).not.toContain('#')
  })

  it('renders optional spots and each decoration through Vue-owned SVG elements', () => {
    const spottedSeed = seedMatching(({ geometry }) => geometry.spots.length > 0)
    const spotted = mount(OrganicAvatar, {
      props: { seed: spottedSeed, color: 'teal', size: 32 },
    })
    expect(spotted.get('svg').attributes('width')).toBe('32')
    expect(spotted.findAll('.avatar-spot')).toHaveLength(
      createAvatarRecipe(spottedSeed, 'teal').geometry.spots.length,
    )
    expect(spotted.find('.avatar-silhouette').exists()).toBe(true)
    expect(Number(spotted.get('svg').attributes('data-avatar-scale'))).toBeGreaterThanOrEqual(0.88)

    for (const kind of Object.values(AVATAR_DECORATIONS)) {
      const seed = seedMatching(({ geometry }) => geometry.decoration?.kind === kind)
      const wrapper = mount(OrganicAvatar, { props: { seed, color: 'teal', size: 36 } })
      expect(wrapper.get('.avatar-decoration').attributes('data-decoration')).toBe(kind)
    }

    const plainSeed = seedMatching(({ geometry }) => geometry.decoration === null)
    const plain = mount(OrganicAvatar, { props: { seed: plainSeed, color: 'teal' } })
    expect(plain.find('.avatar-decoration').exists()).toBe(false)
  })

  it('falls back to a curated fill for an unknown stored color', () => {
    const wrapper = mount(OrganicAvatar, { props: { seed: 'seed-x', color: 'not-a-color' } })
    expect(wrapper.html()).toContain('var(--avatar-coral)')
  })

  it('animates by default and drops animation under reduced motion', () => {
    stubMatchMedia(false)
    const animated = mount(OrganicAvatar, { props: { seed: 'seed-anna', color: 'teal' } })
    expect(animated.find('.avatar-breathe').exists()).toBe(true)

    stubMatchMedia(true)
    const still = mount(OrganicAvatar, { props: { seed: 'seed-anna', color: 'teal' } })
    expect(still.find('.avatar-breathe').exists()).toBe(false)
    expect(still.get('svg').attributes('viewBox')).toBe('0 0 100 100')
  })
})
