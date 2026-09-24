<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import ParticipantSummary from '../components/participants/ParticipantSummary.vue'
import { useRealtimeSummary } from '../composables/useRealtimeSummary'
import { useToday } from '../composables/useToday'
import type { Database } from '../types/database'

type TransportMode = Database['public']['Enums']['transport_mode']
// The form only offers these two modes; legacy 'autonomous' stays valid in the DB.
type SelectableMode = Extract<TransportMode, 'needs_ride' | 'offers_car'>
const today = useToday()
const realtime = useRealtimeSummary()
const attending = ref<boolean | null>(null)
const transportMode = ref<SelectableMode | null>(null)
const carCapacity = ref(5)
const transportOptions: Array<{ value: SelectableMode; label: string }> = [
  { value: 'needs_ride', label: 'Ho bisogno di un passaggio' },
  { value: 'offers_car', label: 'Prendo la macchina' },
]

/** Maps a stored mode to one the form offers, defaulting to asking for a ride. */
function selectableMode(mode: TransportMode | null | undefined): SelectableMode {
  return mode === 'offers_car' ? 'offers_car' : 'needs_ride'
}

function resetForm() {
  const own = today.state.value?.own_declaration
  attending.value = own?.attending ?? null
  transportMode.value = selectableMode(
    own?.transport_mode ?? today.state.value?.preferred_transport_mode,
  )
  carCapacity.value = own?.car_capacity ?? 5
}

function answerYes() {
  attending.value = true
  transportMode.value = selectableMode(
    transportMode.value ?? today.state.value?.preferred_transport_mode,
  )
}

watch(() => today.editing.value, resetForm)
onMounted(async () => {
  await today.load()
  resetForm()
  realtime.start(today.load)
})
onUnmounted(realtime.stop)
</script>

<template>
  <section class="grid min-h-[calc(100svh-4rem)] place-items-center px-5 py-12">
    <div
      v-if="today.loading.value"
      class="loading loading-dots loading-lg"
      aria-label="Caricamento"
    ></div>
    <ParticipantSummary
      v-else-if="today.answered.value && !today.editing.value && today.state.value"
      :participants="today.state.value.participants"
      :missing-seats="today.state.value.missing_seats"
      :online-user-ids="realtime.onlineUserIds.value"
      :connection-status="realtime.status.value"
    />
    <form
      v-else
      class="organic-card w-full max-w-md space-y-6 text-center"
      @submit.prevent="today.save(true, transportMode, carCapacity)"
    >
      <div>
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-primary">Oggi</p>
        <h1 class="mt-2 text-4xl font-black">Mensa?</h1>
      </div>

      <div v-if="attending === null" class="grid grid-cols-2 gap-3">
        <button class="btn btn-primary btn-lg" data-answer="yes" type="button" @click="answerYes">
          Sì
        </button>
        <button
          class="btn btn-ghost btn-lg"
          data-answer="no"
          type="button"
          :disabled="today.saving.value"
          @click="today.save(false)"
        >
          No
        </button>
      </div>

      <fieldset v-else-if="attending" class="space-y-3 text-left">
        <legend class="mb-2 font-bold">Come ti sposti?</legend>
        <label
          v-for="option in transportOptions"
          :key="option.value"
          class="label cursor-pointer justify-start gap-3 rounded-box border border-base-300 px-4"
        >
          <input
            v-model="transportMode"
            class="radio radio-primary"
            type="radio"
            name="transportMode"
            :value="option.value"
            required
          />
          <span>{{ option.label }}</span>
        </label>
        <label v-if="transportMode === 'offers_car'" class="form-control block">
          <span class="label-text font-bold">Capienza totale, conducente incluso</span>
          <input
            v-model.number="carCapacity"
            class="input input-bordered mt-1 w-full"
            type="number"
            min="1"
            max="9"
            required
          />
        </label>
        <button class="btn btn-primary w-full" :disabled="!transportMode || today.saving.value">
          Salva
        </button>
      </fieldset>

      <p v-if="today.error.value" role="alert" class="alert alert-error text-left text-sm">
        {{ today.error.value }}
      </p>
    </form>
  </section>
</template>
