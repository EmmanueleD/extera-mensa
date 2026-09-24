<script setup lang="ts">
import { computed } from 'vue'
import OrganicAvatar from '../avatar/OrganicAvatar.vue'
import PresenceDot from './PresenceDot.vue'
import type { Participant } from '../../composables/useToday'
import { floatDelay } from '../../lib/carpool'
import { messageTextClass } from '../../lib/profile'

const props = defineProps<{ participant: Participant; online: boolean }>()

// Same phase for avatar and bubble so the person moves as one, but out of sync with others.
const phase = computed(() => ({ animationDelay: floatDelay(props.participant.id) }))
</script>

<template>
  <li class="w-32" data-testid="participant-figure">
    <div role="group" :aria-label="participant.display_name" class="carpool-figure text-center">
      <p
        v-if="participant.message"
        class="speech-bubble speech-bubble--down carpool-drift mb-3 max-w-full"
        :class="messageTextClass(participant.message_text_color)"
        :style="phase"
      >
        {{ participant.message }}
      </p>
      <div class="carpool-float" :style="phase">
        <OrganicAvatar
          :seed="participant.avatar_seed"
          :color="participant.avatar_color"
          :size="56"
        />
      </div>
      <p class="mt-1.5 flex max-w-full items-center gap-1.5 text-sm font-bold">
        <PresenceDot :online="online" />
        <span class="truncate">{{ participant.display_name }}</span>
      </p>
    </div>
  </li>
</template>
