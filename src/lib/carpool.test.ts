import { describe, expect, it } from 'vitest'
import type { Participant } from '../composables/useToday'
import { assignSeats, carLabel, floatDelay } from './carpool'

let minute = 0
function person(
  id: string,
  transport_mode: Participant['transport_mode'],
  overrides: Partial<Participant> = {},
): Participant {
  minute += 1
  return {
    id,
    display_name: id[0].toUpperCase() + id.slice(1),
    message: null,
    avatar_seed: `seed-${id}`,
    avatar_color: 'coral',
    message_text_color: 'ink',
    transport_mode,
    car_capacity: transport_mode === 'offers_car' ? 5 : null,
    declared_at: `2026-09-24T09:${String(minute).padStart(2, '0')}:00Z`,
    ...overrides,
  }
}

const ids = (list: Participant[]) => list.map((p) => p.id)

describe('assignSeats', () => {
  it('returns nothing for an empty day', () => {
    expect(assignSeats([])).toEqual({ cars: [], waiting: [] })
  })

  it('leaves a lone rider waiting when there is no car', () => {
    const { cars, waiting } = assignSeats([person('luca', 'needs_ride')])
    expect(cars).toEqual([])
    expect(ids(waiting)).toEqual(['luca'])
  })

  it('fills a five-seat car with two riders and keeps two seats free', () => {
    const anna = person('anna', 'offers_car')
    const { cars, waiting } = assignSeats([
      person('luca', 'needs_ride'),
      anna,
      person('sara', 'needs_ride'),
    ])
    expect(cars).toHaveLength(1)
    expect(cars[0].driver).toBe(anna)
    expect(cars[0].capacity).toBe(5)
    expect(ids(cars[0].passengers)).toEqual(['luca', 'sara'])
    expect(cars[0].emptySeats).toBe(2)
    expect(waiting).toEqual([])
  })

  it('orders cars and riders by declaration time, not by input order', () => {
    const late = person('zed', 'offers_car', {
      car_capacity: 2,
      declared_at: '2026-09-24T10:00:00Z',
    })
    const early = person('bea', 'offers_car', {
      car_capacity: 2,
      declared_at: '2026-09-24T08:00:00Z',
    })
    const second = person('rik', 'needs_ride', { declared_at: '2026-09-24T09:30:00Z' })
    const first = person('ada', 'needs_ride', { declared_at: '2026-09-24T09:00:00Z' })

    const { cars } = assignSeats([late, second, early, first])
    expect(cars.map((car) => car.driver.id)).toEqual(['bea', 'zed'])
    expect(ids(cars[0].passengers)).toEqual(['ada'])
    expect(ids(cars[1].passengers)).toEqual(['rik'])
  })

  it('fills the first car before moving to the next one', () => {
    const { cars, waiting } = assignSeats([
      person('anna', 'offers_car', { car_capacity: 3 }),
      person('bruno', 'offers_car', { car_capacity: 3 }),
      person('carla', 'needs_ride'),
      person('dario', 'needs_ride'),
      person('elena', 'needs_ride'),
    ])
    expect(ids(cars[0].passengers)).toEqual(['carla', 'dario'])
    expect(cars[0].emptySeats).toBe(0)
    expect(ids(cars[1].passengers)).toEqual(['elena'])
    expect(cars[1].emptySeats).toBe(1)
    expect(waiting).toEqual([])
  })

  it('sends riders beyond the available seats to the waiting area in arrival order', () => {
    const { cars, waiting } = assignSeats([
      person('anna', 'offers_car', { car_capacity: 2 }),
      person('bruno', 'needs_ride'),
      person('carla', 'needs_ride'),
      person('dario', 'needs_ride'),
    ])
    expect(ids(cars[0].passengers)).toEqual(['bruno'])
    expect(ids(waiting)).toEqual(['carla', 'dario'])
  })

  it('keeps legacy autonomous participants out of the cars', () => {
    const { cars, waiting } = assignSeats([
      person('anna', 'offers_car'),
      person('otto', 'autonomous'),
      person('luca', 'needs_ride'),
    ])
    expect(ids(cars[0].passengers)).toEqual(['luca'])
    expect(ids(waiting)).toEqual(['otto'])
  })

  it.each([null, 0, -2])('treats capacity %s as a driver-only car', (car_capacity) => {
    const { cars, waiting } = assignSeats([
      person('anna', 'offers_car', { car_capacity }),
      person('luca', 'needs_ride'),
    ])
    expect(cars[0].capacity).toBe(1)
    expect(cars[0].emptySeats).toBe(0)
    expect(ids(waiting)).toEqual(['luca'])
  })

  it('breaks declaration ties by id', () => {
    const at = '2026-09-24T09:00:00Z'
    const { cars } = assignSeats([
      person('b-car', 'offers_car', { car_capacity: 2, declared_at: at }),
      person('a-car', 'offers_car', { car_capacity: 2, declared_at: at }),
      person('z-rider', 'needs_ride', { declared_at: at }),
      person('y-rider', 'needs_ride', { declared_at: at }),
    ])
    expect(cars.map((car) => car.driver.id)).toEqual(['a-car', 'b-car'])
    expect(ids(cars[0].passengers)).toEqual(['y-rider'])
    expect(ids(cars[1].passengers)).toEqual(['z-rider'])
  })

  it('seats riders with an unknown declaration time last', () => {
    const { cars, waiting } = assignSeats([
      person('anna', 'offers_car', { car_capacity: 2 }),
      person('ghost', 'needs_ride', { declared_at: '' }),
      person('luca', 'needs_ride'),
    ])
    expect(ids(cars[0].passengers)).toEqual(['luca'])
    expect(ids(waiting)).toEqual(['ghost'])
  })

  it('does not mutate the input list', () => {
    const input = [person('luca', 'needs_ride'), person('anna', 'offers_car')]
    const snapshot = [...input]
    assignSeats(input)
    expect(input).toEqual(snapshot)
  })
})

describe('carLabel', () => {
  it('describes driver, passengers, and free seats', () => {
    const { cars } = assignSeats([
      person('anna', 'offers_car'),
      person('luca', 'needs_ride'),
      person('sara', 'needs_ride'),
    ])
    expect(carLabel(cars[0])).toBe('Auto di Anna: 2 passeggeri, 2 posti liberi')
  })

  it('uses singular forms', () => {
    const { cars } = assignSeats([
      person('anna', 'offers_car', { car_capacity: 3 }),
      person('luca', 'needs_ride'),
    ])
    expect(carLabel(cars[0])).toBe('Auto di Anna: 1 passeggero, 1 posto libero')
  })
})

describe('floatDelay', () => {
  it('is deterministic, negative, and within one cycle', () => {
    expect(floatDelay('anna')).toBe(floatDelay('anna'))
    const ms = Number(floatDelay('anna').replace(/ms$/, ''))
    expect(ms).toBeLessThanOrEqual(0)
    expect(ms).toBeGreaterThan(-6000)
  })

  it('gives different people different phases', () => {
    expect(floatDelay('anna')).not.toBe(floatDelay('luca'))
  })
})
