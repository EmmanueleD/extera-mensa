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

function rider(id: string, declared_at: string, message: string | null = null) {
  return {
    ...participants[1],
    id,
    display_name: id[0].toUpperCase() + id.slice(1),
    avatar_seed: `seed-${id}`,
    message,
    declared_at,
  }
}

describe('ParticipantSummary', () => {
  it('shows participants in a car with presence and messages, without transport labels', () => {
    const wrapper = mount(ParticipantSummary, {
      props: { participants, missingSeats: 0, onlineUserIds: new Set(['anna']) },
    })

    expect(wrapper.text()).toContain('2 partecipanti')
    expect(wrapper.find('[aria-label="Online"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Offline"]').exists()).toBe(true)
    const car = wrapper.get('[aria-label="Auto di Anna: 1 passeggero, 3 posti liberi"]')
    expect(car.find('[aria-label="Anna, alla guida"]').exists()).toBe(true)
    expect(car.find('[aria-label="Luca"]').exists()).toBe(true)
    expect(car.findAll('[aria-label="Posto libero"]')).toHaveLength(3)
    const occupantGroups = wrapper.findAll('[data-testid="carpool-occupant"]')
    expect(occupantGroups).toHaveLength(2)
    expect(occupantGroups[0].attributes('aria-label')).toBe('Anna')
    expect(occupantGroups[0].text()).toContain('Anna')
    expect(occupantGroups[0].get('.speech-bubble').text()).toBe('Arrivo alle 12')
    expect(occupantGroups[0].find('[aria-label="Online"]').exists()).toBe(true)
    expect(occupantGroups[0].find('svg[aria-hidden="true"]').exists()).toBe(true)
    expect(occupantGroups[1].attributes('aria-label')).toBe('Luca')
    expect(occupantGroups[1].text()).toContain('Luca')
    expect(occupantGroups[1].find('.speech-bubble').exists()).toBe(false)
    expect(occupantGroups[1].find('[aria-label="Offline"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="waiting-area"]').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/Auto · |Cerca un passaggio|Arriva autonomamente/)
    expect(wrapper.find('.organic-card').exists()).toBe(false)
  })

  it('fills seats in arrival order: one car of five with two riders', () => {
    const wrapper = mount(ParticipantSummary, {
      props: {
        participants: [...participants, rider('sara', '2026-09-24T09:10:00Z')],
        missingSeats: 0,
      },
    })

    const car = wrapper.get('[data-testid="carpool-car"]')
    expect(car.find('[aria-label="Auto di Anna: 2 passeggeri, 2 posti liberi"]').exists()).toBe(
      true,
    )
    expect(car.findAll('[data-seat="driver"]')).toHaveLength(1)
    expect(
      car
        .findAll('[data-seat="passenger"]')
        .map((seat) => seat.find('svg').attributes('aria-label')),
    ).toEqual(['Luca', 'Sara'])
    expect(car.findAll('[data-seat="empty"]')).toHaveLength(2)
  })

  it('puts riders without a seat in the waiting area with their bubble', () => {
    const smallCar = { ...participants[0], car_capacity: 2 }
    const wrapper = mount(ParticipantSummary, {
      props: {
        participants: [
          smallCar,
          participants[1],
          rider('sara', '2026-09-24T09:10:00Z', 'Chi mi porta?'),
        ],
        missingSeats: 1,
      },
    })

    const waiting = wrapper.get('[data-testid="waiting-area"]')
    expect(waiting.text()).toContain('In attesa di un passaggio')
    const figures = waiting.findAll('[data-testid="participant-figure"]')
    expect(figures).toHaveLength(1)
    expect(figures[0].text()).toContain('Sara')
    const personGroup = figures[0].get('[role="group"]')
    expect(personGroup.attributes('aria-label')).toBe('Sara')
    expect(personGroup.find('[aria-label="Offline"]').exists()).toBe(true)
    expect(personGroup.find('svg[aria-hidden="true"]').exists()).toBe(true)
    const bubble = personGroup.get('.speech-bubble')
    expect(bubble.text()).toBe('Chi mi porta?')
    expect(bubble.attributes('style')).toContain('animation-delay')
    expect(figures[0].find('.carpool-float').exists()).toBe(true)
  })

  it('shows a lone rider outside when no car is available', () => {
    const wrapper = mount(ParticipantSummary, {
      props: { participants: participants.slice(1), missingSeats: 1 },
    })

    expect(wrapper.find('[data-testid="carpool-car"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="waiting-area"]').text()).toContain('Luca')
    expect(wrapper.get('[role="status"]').text()).toContain('Nessuna auto disponibile')
  })

  it('keeps the status for a shortage of seats', () => {
    const wrapper = mount(ParticipantSummary, {
      props: { participants, missingSeats: 2 },
    })

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
