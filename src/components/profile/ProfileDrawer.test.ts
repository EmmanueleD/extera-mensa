import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ProfileDrawer from './ProfileDrawer.vue'

interface DbResult {
  data: Record<string, unknown> | null
  error: { code: string; message: string } | null
}

const db = vi.hoisted(() => ({
  loadResult: { data: null, error: null } as DbResult,
  updateResult: { data: null, error: null } as DbResult,
  updateArgs: null as Record<string, unknown> | null,
}))

vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({ user: { value: { id: 'owner-1' } } }),
}))

vi.mock('../../lib/supabase', () => ({
  getSupabase: () => ({
    from: () => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        update: (changes: Record<string, unknown>) => {
          db.updateArgs = changes
          return builder
        },
        single: async () => (db.updateArgs ? db.updateResult : db.loadResult),
      }
      return builder
    },
  }),
}))

const storedProfile = {
  display_name: 'Anna',
  message: 'Arrivo alle 12',
  avatar_seed: 'seed-anna',
  avatar_color: 'coral',
  message_text_color: 'ink',
}

async function openDrawer() {
  const wrapper = mount(ProfileDrawer, { props: { open: false }, attachTo: document.body })
  await wrapper.setProps({ open: true })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  db.loadResult = { data: { ...storedProfile }, error: null }
  db.updateResult = { data: { ...storedProfile }, error: null }
  db.updateArgs = null
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ProfileDrawer', () => {
  it('loads the owner profile and focuses the name field on open', async () => {
    const wrapper = await openDrawer()
    const input = wrapper.get('input[type="text"]')

    expect((input.element as HTMLInputElement).value).toBe('Anna')
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.get('.profile-drawer__panel').attributes('role')).toBe('dialog')
    expect(wrapper.get('.profile-drawer__actions').text()).toContain('Salva')
    expect(wrapper.get('.profile-drawer__actions').text()).toContain('Annulla')
  })

  it('shows a duplicate-name error and keeps the drawer open', async () => {
    db.updateResult = { data: null, error: { code: '23505', message: 'duplicate' } }
    const wrapper = await openDrawer()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('già in uso')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('does not expose message editing controls', async () => {
    const wrapper = await openDrawer()

    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.find('[data-action="clear-message"]').exists()).toBe(false)
    expect(wrapper.find('input[name="messageTextColor"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Arrivo alle 12')
    expect(wrapper.text()).not.toContain('Colore del messaggio')
  })

  it('updates only the name and avatar fields', async () => {
    const wrapper = await openDrawer()

    await wrapper.get('input[type="text"]').setValue('  Beatrice  ')
    await wrapper.get('input[name="avatarColor"][value="teal"]').setValue()
    await wrapper.get('[data-action="regenerate"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(db.updateArgs).toEqual({
      display_name: 'Beatrice',
      avatar_seed: expect.any(String),
      avatar_color: 'teal',
    })
    expect(db.updateArgs?.avatar_seed).not.toBe('seed-anna')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes on Escape and restores focus to the trigger', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const wrapper = await openDrawer()

    await wrapper.get('[role="dialog"]').trigger('keydown.esc')

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.activeElement).toBe(trigger)
  })
})
