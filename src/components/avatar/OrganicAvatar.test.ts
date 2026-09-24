import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
