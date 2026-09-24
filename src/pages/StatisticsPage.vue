<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import StatisticsChart from '../components/statistics/StatisticsChart.vue'
import StatisticsDetail from '../components/statistics/StatisticsDetail.vue'
import StatisticsRanking from '../components/statistics/StatisticsRanking.vue'
import { useStatistics } from '../composables/useStatistics'
import {
  STATISTICS_RANGE_OPTIONS,
  totalAttendance,
  type StatisticsRange,
  type StatisticsResult,
} from '../lib/statistics'

const { range, points, ranking, loading, error, result, load, setRange } = useStatistics()
const selectedDate = ref<string | null>(null)

const hasData = computed(() => points.value.length > 0)
const attendanceTotal = computed(() => totalAttendance(points.value))

// Pin a date with attendance so chart, detail, and ranking always describe the same range.
watch(result, (next: StatisticsResult | null) => {
  if (!next) return
  const latest = [...next.points].reverse().find((point) => point.attending_count > 0)
  selectedDate.value = (latest ?? next.points[next.points.length - 1])?.service_date ?? null
})

onMounted(() => {
  void load()
})

async function changeRange(next: StatisticsRange) {
  await setRange(next)
}
</script>

<template>
  <section class="mx-auto w-full max-w-3xl space-y-6 px-5 py-10">
    <header>
      <p class="text-sm font-bold uppercase tracking-[0.18em] text-secondary">Andamento</p>
      <h1 class="text-3xl font-black">Statistiche</h1>
    </header>

    <div class="join" role="group" aria-label="Intervallo temporale">
      <button
        v-for="option in STATISTICS_RANGE_OPTIONS"
        :key="option.value"
        type="button"
        class="btn join-item"
        :class="{ 'btn-primary': range === option.value }"
        :aria-pressed="range === option.value"
        :aria-label="option.accessibleLabel"
        :data-range="option.value"
        @click="changeRange(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="loading" class="loading loading-dots loading-lg" aria-label="Caricamento"></div>
    <p v-else-if="error" role="alert" class="alert alert-error">{{ error }}</p>
    <div v-else-if="!hasData" class="organic-card text-center text-base-content/70">
      Non ci sono ancora dati da mostrare.
    </div>
    <template v-else>
      <p class="text-sm text-base-content/70">
        {{ attendanceTotal }} presenze nel periodo selezionato.
      </p>
      <StatisticsChart
        :points="points"
        :selected-date="selectedDate"
        @select="selectedDate = $event"
      />
      <StatisticsDetail v-model:selected-date="selectedDate" :points="points" />
      <StatisticsRanking :ranking="ranking" />
    </template>
  </section>
</template>
