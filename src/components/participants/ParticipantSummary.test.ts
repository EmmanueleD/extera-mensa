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
  it('makes only the owner driver interactive and propagates the edit event', async () => {
    const wrapper = mount(ParticipantSummary, {
      props: {
        participants,
        missingSeats: 0,
        onlineUserIds: new Set(['anna']),
        ownerId: 'anna',
      },
    })

    expect(wrapper.text()).toContain('2 partecipanti')
    expect(
      wrapper.get('.participant-summary__cars').findAll('[data-testid="carpool-car"]'),
    ).toHaveLength(1)
    expect(wrapper.find('[aria-label="Online"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Offline"]').exists()).toBe(true)
    const car = wrapper.get('[aria-label="Auto di Anna: 1 passeggero, 3 posti liberi"]')
    expect(car.find('[aria-label="Modifica il tuo messaggio, Anna, alla guida"]').exists()).toBe(
      true,
    )
    expect(car.find('[aria-label="Luca"]').exists()).toBe(true)
    expect(car.findAll('[aria-label="Posto libero"]')).toHaveLength(3)
    const occupiedSeats = wrapper.findAll('[data-testid="carpool-occupant"]')
    expect(occupiedSeats).toHaveLength(2)
    expect(occupiedSeats[0].attributes('data-seat')).toBe('driver')
    expect(occupiedSeats[0].get('.speech-bubble').text()).toBe('Arrivo alle 12')
    expect(occupiedSeats[0].get('.participant-avatar-control__initial').text()).toBe('A')
    const steeringWheel = occupiedSeats[0].get('.carpool-steering-wheel')
    expect(steeringWheel.attributes('aria-hidden')).toBe('true')
    expect(occupiedSeats[0].find('[aria-label="Online"]').exists()).toBe(true)
    expect(occupiedSeats[1].attributes('data-seat')).toBe('passenger')
    expect(occupiedSeats[1].find('.carpool-steering-wheel').exists()).toBe(false)
    expect(occupiedSeats[1].find('.speech-bubble').exists()).toBe(false)
    expect(occupiedSeats[1].get('.participant-avatar-control__initial').text()).toBe('L')
    expect(occupiedSeats[1].find('[aria-label="Offline"]').exists()).toBe(true)

    const driverControl = occupiedSeats[0].get('button')
    expect(driverControl.attributes('aria-label')).toBe(
      'Modifica il tuo messaggio, Anna, alla guida',
    )
    expect(occupiedSeats[1].find('button').exists()).toBe(false)
    const passengerIdentity = occupiedSeats[1].get('.participant-avatar-control[role="group"]')
    expect(passengerIdentity.attributes('aria-label')).toBe('Luca')
    expect(passengerIdentity.attributes('tabindex')).toBeUndefined()
    expect(passengerIdentity.get('[aria-label="Offline"]').attributes('role')).toBe('img')
    await driverControl.trigger('click')
    expect(wrapper.emitted('edit-message')).toEqual([[participants[0]]])
    expect(wrapper.find('[data-testid="waiting-area"]').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/Auto · |Cerca un passaggio|Arriva autonomamente/)
    expect(wrapper.find('.organic-card').exists()).toBe(false)
  })

  it('keeps car and seat geometry stable when participant messages are shown', () => {
    const withoutMessages = participants.map((participant) => ({ ...participant, message: null }))
    const withoutMessageWrapper = mount(ParticipantSummary, {
      props: { participants: withoutMessages, missingSeats: 0 },
    })
    const withMessageWrapper = mount(ParticipantSummary, {
      props: { participants, missingSeats: 0 },
    })

    const carWithoutMessages = withoutMessageWrapper.get('[role="group"]')
    const carWithMessages = withMessageWrapper.get('[role="group"]')
    expect(carWithMessages.classes()).toEqual(carWithoutMessages.classes())
    expect(carWithMessages.attributes('style')).toBe(carWithoutMessages.attributes('style'))
    expect(carWithMessages.find('.speech-bubble').exists()).toBe(true)
    expect(carWithMessages.get('[data-seat="driver"]').classes()).toEqual(
      carWithoutMessages.get('[data-seat="driver"]').classes(),
    )
  })

  it('makes only an owner passenger interactive', async () => {
    const wrapper = mount(ParticipantSummary, {
      props: { participants, missingSeats: 0, ownerId: 'luca' },
    })

    const driverSeat = wrapper.get('[data-seat="driver"]')
    expect(driverSeat.find('button').exists()).toBe(false)
    const driverIdentity = driverSeat.get('.participant-avatar-control[role="group"]')
    expect(driverIdentity.attributes('aria-label')).toBe('Anna, alla guida')
    expect(driverIdentity.attributes('tabindex')).toBeUndefined()
    expect(driverIdentity.get('[aria-label="Offline"]').attributes('role')).toBe('img')
    expect(driverSeat.find('.participant-avatar-control__avatar > svg').exists()).toBe(true)

    const passengerButton = wrapper.get('[data-seat="passenger"] button')
    expect(passengerButton.attributes('aria-label')).toBe('Modifica il tuo messaggio, Luca')
    await passengerButton.trigger('click')
    expect(wrapper.emitted('edit-message')).toEqual([[participants[1]]])
  })

  it('fills seats in arrival order: one car of five with two riders', () => {
    const wrapper = mount(ParticipantSummary, {
      props: {
        participants: [
          participants[0],
          { ...participants[1], message: 'Ci sono' },
          rider('sara', '2026-09-24T09:10:00Z'),
        ],
        missingSeats: 0,
      },
    })

    const car = wrapper.get('[data-testid="carpool-car"]')
    expect(car.find('[aria-label="Auto di Anna: 2 passeggeri, 2 posti liberi"]').exists()).toBe(
      true,
    )
    expect(car.findAll('[data-seat="driver"]')).toHaveLength(1)
    const passengerSeats = car.findAll('[data-seat="passenger"]')
    expect(
      passengerSeats.map((seat) =>
        seat.get('.participant-avatar-control[role="group"]').attributes('aria-label'),
      ),
    ).toEqual(['Luca', 'Sara'])
    const lucaBubble = passengerSeats[0].get('.speech-bubble')
    expect(lucaBubble.text()).toBe('Ci sono')
    expect(lucaBubble.classes()).toContain('carpool-seat-bubble--lane-1')
    expect(car.findAll('[data-seat="empty"]')).toHaveLength(2)
  })

  it('makes a waiting owner interactive while preserving the waiting figure', async () => {
    const smallCar = { ...participants[0], car_capacity: 2 }
    const wrapper = mount(ParticipantSummary, {
      props: {
        participants: [
          smallCar,
          participants[1],
          rider('sara', '2026-09-24T09:10:00Z', 'Chi mi porta?'),
        ],
        missingSeats: 1,
        ownerId: 'sara',
      },
    })

    const waiting = wrapper.get('[data-testid="waiting-area"]')
    expect(waiting.text()).toContain('In attesa di un passaggio')
    const figures = waiting.findAll('[data-testid="participant-figure"]')
    expect(figures).toHaveLength(1)
    expect(waiting.get('.participant-summary__waiting').classes()).toContain(
      'participant-summary__waiting',
    )
    expect(figures[0].text()).toContain('Sara')
    const personGroup = figures[0].get('[role="group"]')
    expect(personGroup.attributes('aria-label')).toBe('Sara')
    expect(personGroup.find('[aria-label="Offline"]').exists()).toBe(true)
    expect(personGroup.find('svg[aria-hidden="true"]').exists()).toBe(true)
    const bubble = personGroup.get('.speech-bubble')
    expect(bubble.text()).toBe('Chi mi porta?')
    expect(bubble.attributes('style')).toContain('animation-delay')
    expect(figures[0].find('.carpool-float').exists()).toBe(true)
    expect(figures[0].get('.participant-avatar-control__initial').text()).toBe('S')
    const control = figures[0].get('button')
    expect(control.attributes('aria-label')).toBe('Modifica il tuo messaggio, Sara')
    await control.trigger('click')
    expect(wrapper.emitted('edit-message')).toEqual([[expect.objectContaining({ id: 'sara' })]])
  })

  it('shows a lone rider outside when no car is available', () => {
    const wrapper = mount(ParticipantSummary, {
      props: { participants: participants.slice(1), missingSeats: 1 },
    })

    expect(wrapper.find('[data-testid="carpool-car"]').exists()).toBe(false)
    const waiting = wrapper.get('[data-testid="waiting-area"]')
    expect(waiting.text()).toContain('Luca')
    expect(waiting.find('button').exists()).toBe(false)
    const identity = waiting.get('.participant-avatar-control[role="group"]')
    expect(identity.attributes('aria-label')).toBe('Luca')
    expect(identity.attributes('tabindex')).toBeUndefined()
    expect(identity.get('[aria-label="Offline"]').attributes('role')).toBe('img')
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
