import type { Participant } from '../composables/useToday'

/** One car of the day: its driver, who sits inside, and how many seats remain. */
export interface CarAssignment {
  driver: Participant
  /** Total seats, driver included. Always at least 1. */
  capacity: number
  passengers: Participant[]
  emptySeats: number
}

export interface SeatAssignment {
  cars: CarAssignment[]
  /** Riders without a seat plus legacy participants who do not ride in a car. */
  waiting: Participant[]
}

function declaredTime(participant: Participant): number {
  const time = Date.parse(participant.declared_at)
  // Unknown timestamps go last so they never steal a seat from a known arrival.
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

/** Arrival order: first declaration wins, ties resolved by id for stability. */
export function byArrival(a: Participant, b: Participant): number {
  const delta = declaredTime(a) - declaredTime(b)
  if (delta !== 0 && !Number.isNaN(delta)) return delta
  if (a.id === b.id) return 0
  return a.id < b.id ? -1 : 1
}

function normalizeCapacity(capacity: number | null): number {
  if (capacity === null || !Number.isFinite(capacity) || capacity < 1) return 1
  return Math.floor(capacity)
}

/**
 * Seats riders in arrival order: each rider takes the first free seat in the
 * earliest-declared car. Riders left over, and legacy `autonomous` participants,
 * end up in `waiting`, also in arrival order.
 */
export function assignSeats(participants: readonly Participant[]): SeatAssignment {
  const ordered = [...participants].sort(byArrival)

  const cars: CarAssignment[] = ordered
    .filter((participant) => participant.transport_mode === 'offers_car')
    .map((driver) => {
      const capacity = normalizeCapacity(driver.car_capacity)
      return { driver, capacity, passengers: [], emptySeats: capacity - 1 }
    })

  const waiting: Participant[] = []
  for (const participant of ordered) {
    if (participant.transport_mode === 'offers_car') continue
    const car =
      participant.transport_mode === 'needs_ride' ? cars.find((c) => c.emptySeats > 0) : undefined
    if (car) {
      car.passengers.push(participant)
      car.emptySeats -= 1
    } else {
      waiting.push(participant)
    }
  }

  return { cars, waiting }
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

/** Accessible description, e.g. "Auto di Anna: 2 passeggeri, 2 posti liberi". */
export function carLabel(car: CarAssignment): string {
  const passengers = plural(car.passengers.length, 'passeggero', 'passeggeri')
  const seats = plural(car.emptySeats, 'posto libero', 'posti liberi')
  return `Auto di ${car.driver.display_name}: ${passengers}, ${seats}`
}

const FLOAT_CYCLE_MS = 6000

/**
 * Negative animation delay derived from an id, so each person starts the float
 * cycle at a different phase and nobody bobs in sync with a neighbor.
 */
export function floatDelay(id: string): string {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  }
  return `-${hash % FLOAT_CYCLE_MS}ms`
}
