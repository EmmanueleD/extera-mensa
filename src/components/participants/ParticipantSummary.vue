<script setup lang="ts">
import { computed } from 'vue'
import type { Participant } from '../../composables/useToday'

const props = defineProps<{
  participants: Participant[]
  missingSeats: number
}>()

const participantLabel = computed(() =>
  props.participants.length === 1 ? '1 partecipante' : `${props.participants.length} partecipanti`,
)

const messageColors: Record<string, string> = {
  ink: 'text-base-content',
  coral: 'text-primary',
  teal: 'text-secondary',
  violet: 'text-violet-700 dark:text-violet-300',
  blue: 'text-blue-700 dark:text-blue-300',
}

function transportLabel(participant: Participant) {
  if (participant.transport_mode === 'offers_car') return `Auto · ${participant.car_capacity} posti`
  if (participant.transport_mode === 'needs_ride') return 'Cerca un passaggio'
  return 'Arriva autonomamente'
}
</script>

<template>
  <section class="mx-auto w-full max-w-2xl space-y-5" aria-labelledby="participants-title">
    <header class="flex items-end justify-between gap-4">
      <div>
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-primary">Oggi</p>
        <h1 id="participants-title" class="text-3xl font-black">{{ participantLabel }}</h1>
      </div>
    </header>

    <p v-if="participants.length === 0" class="organic-card text-center text-base-content/70">
      Nessuno va ancora in mensa.
    </p>
    <ul v-else class="space-y-3">
      <li
        v-for="participant in participants"
        :key="participant.id"
        class="organic-card flex gap-4 p-5"
      >
        <div
          class="grid size-12 shrink-0 place-items-center rounded-[45%_55%_48%_52%] bg-primary font-black text-primary-content"
          aria-hidden="true"
        >
          {{ participant.display_name.slice(0, 1).toLocaleUpperCase('it') }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="font-black">{{ participant.display_name }}</h2>
            <span class="text-sm text-base-content/65">{{ transportLabel(participant) }}</span>
          </div>
          <p
            v-if="participant.message"
            class="mt-2 rounded-2xl rounded-tl-sm bg-base-200 px-3 py-2 text-sm"
            :class="messageColors[participant.message_text_color] ?? messageColors.ink"
          >
            “{{ participant.message }}”
          </p>
        </div>
      </li>
    </ul>

    <p
      role="status"
      class="alert font-bold"
      :class="missingSeats > 0 ? 'alert-warning' : 'alert-success'"
    >
      <span v-if="missingSeats > 0"
        >Mancano ancora {{ missingSeats }} {{ missingSeats === 1 ? 'posto' : 'posti' }}</span
      >
      <span v-else>Tutti hanno un posto</span>
    </p>
  </section>
</template>
