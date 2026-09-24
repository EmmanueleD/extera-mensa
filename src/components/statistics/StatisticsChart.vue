<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { CategoryScale, Chart as ChartJS, LineElement, LinearScale, PointElement } from 'chart.js'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { useReducedMotion } from '../../composables/useReducedMotion'
import { toChartData, toChartLabels, type StatisticsPoint } from '../../lib/statistics'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement)

const props = defineProps<{ points: StatisticsPoint[]; selectedDate?: string | null }>()
const emit = defineEmits<{ select: [serviceDate: string] }>()

const prefersReducedMotion = useReducedMotion()

const GRID_COLOR = 'color-mix(in oklab, var(--color-base-content) 12%, transparent)'

const chartData = computed<ChartData<'line'>>(() => ({
  labels: toChartLabels(props.points),
  datasets: [
    {
      label: 'Partecipanti',
      data: toChartData(props.points),
      borderColor: 'var(--color-primary)',
      backgroundColor: 'var(--color-primary)',
      pointBackgroundColor: props.points.map((point) =>
        point.service_date === props.selectedDate
          ? 'var(--color-secondary)'
          : 'var(--color-primary)',
      ),
      pointBorderColor: 'var(--color-base-100)',
      pointRadius: props.points.map((point) => (point.service_date === props.selectedDate ? 6 : 4)),
      pointHoverRadius: 6,
      pointHitRadius: 14,
      tension: 0.3,
      fill: false,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: prefersReducedMotion.value ? false : { duration: 400 },
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: {
      ticks: { color: 'var(--color-base-content)', maxRotation: 0, autoSkipPadding: 12 },
      grid: { color: GRID_COLOR },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, color: 'var(--color-base-content)' },
      grid: { color: GRID_COLOR },
    },
  },
  onHover: (_event, elements) => {
    const point = elements[0] && props.points[elements[0].index]
    if (point) emit('select', point.service_date)
  },
  onClick: (_event, elements) => {
    const point = elements[0] && props.points[elements[0].index]
    if (point) emit('select', point.service_date)
  },
}))
</script>

<template>
  <div class="h-72 w-full" aria-hidden="true" data-testid="statistics-chart">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
