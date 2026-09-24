<script setup lang="ts">
import { computed, ref } from 'vue'
import OrganicAvatar from '../avatar/OrganicAvatar.vue'
import PresenceDot from './PresenceDot.vue'
import type { Participant } from '../../composables/useToday'
import { floatDelay } from '../../lib/carpool'
import { messageTextClass } from '../../lib/profile'

const props = defineProps<{ participant: Participant; online: boolean }>()

// Same phase for avatar and bubble so the person moves as one, but out of sync with others.
const phase = computed(() => ({ animationDelay: floatDelay(props.participant.id) }))
const expanded = ref(false)
const initial = computed(
  () => Array.from(props.participant.display_name.trim())[0]?.toLocaleUpperCase('it-IT') ?? '?',
)
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
        <button
          type="button"
          class="participant-avatar-control participant-avatar-control--waiting"
          :class="{ 'participant-avatar-control--expanded': expanded }"
          :aria-label="participant.display_name"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          <span class="participant-avatar-control__avatar">
            <OrganicAvatar
              :seed="participant.avatar_seed"
              :color="participant.avatar_color"
              :size="56"
            />
          </span>
          <span class="participant-avatar-control__initial" aria-hidden="true">{{ initial }}</span>
          <PresenceDot :online="online" />
          <span class="participant-avatar-control__name" aria-hidden="true">
            {{ participant.display_name }}
          </span>
        </button>
      </div>
    </div>
  </li>
</template>
