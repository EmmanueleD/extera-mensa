import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MessageEditorDialog from './MessageEditorDialog.vue'

const update = vi.hoisted(() => vi.fn())
const profile = vi.hoisted(() => ({
  saving: { value: false },
  error: { value: null as string | null },
  update,
  resetError: vi.fn(),
}))

vi.mock('../../composables/useProfile', () => ({ useProfile: () => profile }))

const defaultProps = {
  open: true,
  message: 'Arrivo alle 12',
  messageTextColor: 'coral',
}

beforeEach(() => {
  vi.clearAllMocks()
  profile.error.value = null
  profile.resetError.mockImplementation(() => {
    profile.error.value = null
  })
  update.mockResolvedValue(true)
})

describe('MessageEditorDialog', () => {
  it('loads the current message values and focuses the textarea', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mount(MessageEditorDialog, { props: defaultProps, attachTo: document.body })
    await nextTick()

    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Arrivo alle 12')
    expect((wrapper.get('input[value="coral"]').element as HTMLInputElement).checked).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('textarea').element)
    wrapper.unmount()
    trigger.remove()
  })

  it('clears stale profile errors each time it reopens', async () => {
    const wrapper = mount(MessageEditorDialog, {
      props: { ...defaultProps, open: false },
    })

    await wrapper.setProps({ open: true })
    await wrapper.setProps({ open: false })
    profile.error.value = 'Errore precedente'
    await wrapper.setProps({ open: true })
    await nextTick()

    expect(profile.resetError).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('saves only the trimmed message and selected color', async () => {
    const wrapper = mount(MessageEditorDialog, { props: defaultProps })
    await wrapper.get('textarea').setValue('  Nuovo messaggio  ')
    await wrapper.get('input[value="blue"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(update).toHaveBeenCalledWith({
      message: 'Nuovo messaggio',
      message_text_color: 'blue',
    })
    expect(wrapper.emitted('saved')).toHaveLength(1)
  })

  it('removes the message while preserving its selected color', async () => {
    const wrapper = mount(MessageEditorDialog, { props: defaultProps })
    await wrapper.get('[data-action="remove-message"]').trigger('click')
    await flushPromises()

    expect(update).toHaveBeenCalledWith({ message: null, message_text_color: 'coral' })
    expect(wrapper.emitted('removed')).toHaveLength(1)
  })

  it('rejects messages longer than 140 characters', async () => {
    const wrapper = mount(MessageEditorDialog, { props: defaultProps })
    await wrapper.get('textarea').setValue('a'.repeat(141))
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="alert"]').text()).toContain('al massimo 140 caratteri')
    expect(update).not.toHaveBeenCalled()
  })

  it('closes with Escape or the explicit close button and restores trigger focus', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const wrapper = mount(MessageEditorDialog, { props: defaultProps, attachTo: document.body })
    await nextTick()

    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.activeElement).toBe(trigger)

    await wrapper.setProps({ open: false })
    trigger.focus()
    await wrapper.setProps({ open: true })
    await nextTick()
    await wrapper.get('[aria-label="Chiudi"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
    expect(document.activeElement).toBe(trigger)

    wrapper.unmount()
    trigger.remove()
  })
})
