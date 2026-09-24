import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ParticipantSummary from './ParticipantSummary.vue'

const participants = [
  {
    id: 'anna',
    display_name: 'Anna',
    message: 'Arrivo alle 12',
    avatar_seed: 'seed-anna',
    avatar_color: 'coral',
    message_text_color: 'ink',
    transport_mode: 'offers_car' as const,
    car_capacity: 5,
    declared_at: '2026-09-24T09:00:00Z',
  },
  {
    id: 'luca',
    display_name: 'Luca',
    message: null,
    avatar_seed: 'seed-luca',
    avatar_color: 'teal',
    message_text_color: 'blue',
    transport_mode: 'needs_ride' as const,
    car_capacity: null,
    declared_at: '2026-09-24T09:05:00Z',
  },
]

describe('ParticipantSummary', () => {
  it('shows participants, transport details, messages, and missing seats', () => {
    const wrapper = mount(ParticipantSummary, {
      props: { participants, missingSeats: 2, onlineUserIds: new Set(['anna']) },
    })

    expect(wrapper.text()).toContain('2 partecipanti')
    expect(wrapper.text()).toContain('Anna')
    expect(wrapper.find('[aria-label="Online"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Offline"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Auto · 5 posti')
    expect(wrapper.text()).toContain('Arrivo alle 12')
    expect(wrapper.text()).toContain('Luca')
    expect(wrapper.text()).toContain('Cerca un passaggio')
    expect(wrapper.get('[role="status"]').text()).toContain('Auto insufficienti')
    expect(wrapper.get('[role="status"]').text()).toContain('mancano 2 posti')
  })

  it('warns that no car is available when only riders are going', () => {
    const wrapper = mount(ParticipantSummary, {
      props: { participants: participants.slice(1), missingSeats: 1 },
    })

    const status = wrapper.get('[role="status"]')
    expect(status.text()).toContain('Nessuna auto disponibile')
    expect(status.text()).toContain('1 persona cerca un passaggio')
    expect(status.classes()).toContain('alert-warning')
  })

  it('confirms there are enough cars when every rider has a seat', () => {
    const wrapper = mount(ParticipantSummary, {
      props: { participants, missingSeats: 0 },
    })

    const status = wrapper.get('[role="status"]')
    expect(status.text()).toContain('Auto sufficienti')
    expect(status.text()).toContain('3 posti liberi')
    expect(status.classes()).toContain('alert-success')
  })

  it('says nobody needs a ride when there are no riders', () => {
    const wrapper = mount(ParticipantSummary, {
      props: { participants: participants.slice(0, 1), missingSeats: 0 },
    })

    expect(wrapper.get('[role="status"]').text()).toContain('Nessuno cerca un passaggio')
  })

  it('hides the travel status when nobody is going', () => {
    const wrapper = mount(ParticipantSummary, {
      props: { participants: [], missingSeats: 0 },
    })

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })
})
