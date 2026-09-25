<script setup lang="ts">
import { computed } from 'vue'
import CarpoolCar from '../carpool/CarpoolCar.vue'
import ParticipantFigure from '../carpool/ParticipantFigure.vue'
import type { RealtimeStatus } from '../../composables/useRealtimeSummary'
import type { Participant } from '../../composables/useToday'
import { assignSeats } from '../../lib/carpool'

const props = withDefaults(
  defineProps<{
    participants: Participant[]
    missingSeats: number
    onlineUserIds?: Set<string>
    connectionStatus?: RealtimeStatus
    ownerId?: string | null
  }>(),
  {
    onlineUserIds: () => new Set<string>(),
    connectionStatus: 'disconnected',
    ownerId: null,
  },
)
const emit = defineEmits<{ 'edit-message': [participant: Participant] }>()

const participantLabel = computed(() =>
  props.participants.length === 1 ? '1 partecipante' : `${props.participants.length} partecipanti`,
)

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)

const travelStatus = computed(() => {
  const riders = props.participants.filter((p) => p.transport_mode === 'needs_ride').length
  const cars = props.participants.filter((p) => p.transport_mode === 'offers_car')
  const freeSeats = cars.reduce((sum, p) => sum + Math.max(0, (p.car_capacity ?? 1) - 1), 0)

  if (riders === 0) return { ok: true, text: 'Nessuno cerca un passaggio' }
  const riderText = `${riders} ${plural(riders, 'persona cerca', 'persone cercano')} un passaggio`
  if (cars.length === 0) return { ok: false, text: `Nessuna auto disponibile: ${riderText}` }
  if (props.missingSeats > 0) {
    const missing = `${props.missingSeats} ${plural(props.missingSeats, 'posto', 'posti')}`
    return { ok: false, text: `Auto insufficienti: mancano ${missing} (${riderText})` }
  }
  const spare = freeSeats - riders
  const spareText = spare > 0 ? ` · ${spare} ${plural(spare, 'posto libero', 'posti liberi')}` : ''
  return { ok: true, text: `Auto sufficienti: tutti hanno un passaggio${spareText}` }
})

const seating = computed(() => assignSeats(props.participants))
</script>

<template>
  <section
    class="participant-summary mx-auto w-full max-w-2xl space-y-5"
    aria-labelledby="participants-title"
  >
    <header class="participant-summary__header flex items-end justify-between gap-4">
      <div>
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-primary">Oggi</p>
        <h1 id="participants-title" class="text-3xl font-black">{{ participantLabel }}</h1>
      </div>
      <span v-if="connectionStatus === 'reconnecting'" class="badge badge-warning"
        >Riconnessione…</span
      >
    </header>

    <p v-if="participants.length === 0" class="organic-card text-center text-base-content/70">
      Nessuno va ancora in mensa.
    </p>
    <template v-else>
      <ul
        v-if="seating.cars.length"
        class="participant-summary__cars flex flex-wrap justify-center gap-x-8 gap-y-10"
      >
        <CarpoolCar
          v-for="car in seating.cars"
          :key="car.driver.id"
          :car="car"
          :online-user-ids="onlineUserIds"
          :owner-id="ownerId"
          @edit-message="emit('edit-message', $event)"
        />
      </ul>

      <section
        v-if="seating.waiting.length"
        class="space-y-4 pt-2"
        aria-labelledby="waiting-title"
        data-testid="waiting-area"
      >
        <h2 id="waiting-title" class="text-center text-lg font-black">In attesa di un passaggio</h2>
        <ul
          class="participant-summary__waiting flex flex-wrap items-end justify-center gap-x-4 gap-y-6"
        >
          <ParticipantFigure
            v-for="participant in seating.waiting"
            :key="participant.id"
            :participant="participant"
            :online="onlineUserIds.has(participant.id)"
            :owner-id="ownerId"
            @edit-message="emit('edit-message', $event)"
          />
        </ul>
      </section>
    </template>

    <p
      v-if="participants.length > 0"
      role="status"
      class="alert font-bold"
      :class="travelStatus.ok ? 'alert-success' : 'alert-warning'"
    >
      <span>{{ travelStatus.text }}</span>
    </p>
  </section>
</template>
