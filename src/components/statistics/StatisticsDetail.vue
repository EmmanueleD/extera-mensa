<script setup lang="ts">
import { computed } from 'vue'
import OrganicAvatar from '../avatar/OrganicAvatar.vue'
import { formatServiceDate, type StatisticsPoint } from '../../lib/statistics'

const props = defineProps<{ points: StatisticsPoint[] }>()
const selectedDate = defineModel<string | null>('selectedDate', { default: null })

const selectedPoint = computed(
  () => props.points.find((point) => point.service_date === selectedDate.value) ?? null,
)

function countLabel(count: number) {
  return count === 1 ? '1 partecipante' : `${count} partecipanti`
}
</script>

<template>
  <div class="statistics-detail space-y-3">
    <label class="form-control block">
      <span class="label-text font-bold">Data da mostrare</span>
      <select
        v-model="selectedDate"
        class="select select-bordered mt-1 w-full"
        data-testid="statistics-date"
      >
        <option v-for="point in points" :key="point.service_date" :value="point.service_date">
          {{ formatServiceDate(point.service_date) }} · {{ countLabel(point.attending_count) }}
        </option>
      </select>
    </label>

    <section aria-live="polite" class="organic-card p-5">
      <template v-if="selectedPoint">
        <h2 class="font-black">{{ formatServiceDate(selectedPoint.service_date) }}</h2>
        <p class="text-sm text-base-content/70">{{ countLabel(selectedPoint.attending_count) }}</p>
        <ul v-if="selectedPoint.participants.length > 0" class="mt-3 space-y-2">
          <li
            v-for="participant in selectedPoint.participants"
            :key="participant.id"
            class="statistics-detail__participant flex min-w-0 items-center gap-3"
          >
            <OrganicAvatar
              :seed="participant.avatar_seed"
              :color="participant.avatar_color"
              :size="36"
            />
            <span class="min-w-0 break-words font-bold">{{ participant.display_name }}</span>
          </li>
        </ul>
        <p v-else class="mt-2 text-base-content/70">Nessuno è andato in mensa in questa data.</p>
      </template>
      <p v-else class="text-base-content/70">Seleziona una data per vedere chi c'era.</p>
    </section>
  </div>
</template>
