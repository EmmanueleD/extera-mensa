<script setup lang="ts">
import OrganicAvatar from '../avatar/OrganicAvatar.vue'
import type { StatisticsRankRow } from '../../lib/statistics'

defineProps<{ ranking: StatisticsRankRow[] }>()

function totalLabel(count: number) {
  return count === 1 ? '1 presenza' : `${count} presenze`
}
</script>

<template>
  <section aria-labelledby="statistics-ranking-title" class="statistics-ranking space-y-3">
    <h2 id="statistics-ranking-title" class="text-xl font-black">Classifica</h2>
    <p v-if="ranking.length === 0" class="organic-card text-base-content/70">
      Nessuna presenza nel periodo selezionato.
    </p>
    <ol v-else class="space-y-2">
      <li
        v-for="(row, index) in ranking"
        :key="row.id"
        class="statistics-ranking__row organic-card flex min-w-0 items-center gap-3 p-4"
      >
        <span class="w-6 text-center font-black text-primary">{{ index + 1 }}</span>
        <OrganicAvatar :seed="row.avatar_seed" :color="row.avatar_color" :size="32" />
        <span class="min-w-0 flex-1 truncate font-bold">{{ row.display_name }}</span>
        <span class="statistics-ranking__total text-sm text-base-content/70">
          {{ totalLabel(row.attendance_count) }}
        </span>
      </li>
    </ol>
  </section>
</template>
