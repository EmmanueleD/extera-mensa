<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useToday } from '../composables/useToday'
import type { Database } from '../types/database'

type TransportMode = Database['public']['Enums']['transport_mode']
const today = useToday()
const attending = ref<boolean | null>(null)
const transportMode = ref<TransportMode | null>(null)
const carCapacity = ref(5)
const transportOptions: Array<{ value: TransportMode; label: string }> = [
  { value: 'needs_ride', label: 'Cerco un passaggio' },
  { value: 'offers_car', label: 'Offro la mia auto' },
  { value: 'autonomous', label: 'Vado autonomamente' },
]

function resetForm() {
  const own = today.state.value?.own_declaration
  attending.value = own?.attending ?? null
  transportMode.value = own?.transport_mode ?? today.state.value?.preferred_transport_mode ?? null
  carCapacity.value = own?.car_capacity ?? 5
}

function answerYes() {
  attending.value = true
  transportMode.value ??= today.state.value?.preferred_transport_mode ?? null
}

watch(() => today.editing.value, resetForm)
onMounted(async () => {
  await today.load()
  resetForm()
})
</script>

<template>
  <section class="grid min-h-[calc(100svh-4rem)] place-items-center px-5 py-12">
    <div
      v-if="today.loading.value"
      class="loading loading-dots loading-lg"
      aria-label="Caricamento"
    ></div>
    <div
      v-else-if="today.answered.value && !today.editing.value"
      class="organic-card w-full max-w-xl text-center"
    >
      <p class="text-sm font-bold uppercase tracking-[0.18em] text-success">Risposta salvata</p>
      <h1 class="mt-2 text-3xl font-black">La lista di oggi è pronta</h1>
      <p class="mt-3 text-base-content/70">
        Il riepilogo dei partecipanti arriverà nella prossima unità.
      </p>
    </div>
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
