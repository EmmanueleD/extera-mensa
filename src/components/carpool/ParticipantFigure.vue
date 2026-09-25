<script setup lang="ts">
import { computed } from 'vue'
import OrganicAvatar from '../avatar/OrganicAvatar.vue'
import PresenceDot from './PresenceDot.vue'
import type { Participant } from '../../composables/useToday'
import { floatDelay } from '../../lib/carpool'
import { messageTextClass } from '../../lib/profile'

const props = withDefaults(
  defineProps<{ participant: Participant; online: boolean; ownerId?: string | null }>(),
  { ownerId: null },
)
const emit = defineEmits<{ 'edit-message': [participant: Participant] }>()

// Same phase for avatar and bubble so the person moves as one, but out of sync with others.
const phase = computed(() => ({ animationDelay: floatDelay(props.participant.id) }))
const initial = computed(
  () => Array.from(props.participant.display_name.trim())[0]?.toLocaleUpperCase('it-IT') ?? '?',
)
const isOwner = computed(() => props.participant.id === props.ownerId)
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
          v-if="isOwner"
          type="button"
          class="participant-avatar-control participant-avatar-control--waiting"
          :aria-label="`Modifica il tuo messaggio, ${participant.display_name}`"
          @click="emit('edit-message', participant)"
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
        <div
          v-else
          class="participant-avatar-control participant-avatar-control--waiting"
          role="group"
          :aria-label="participant.display_name"
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
        </div>
      </div>
    </div>
  </li>
</template>
