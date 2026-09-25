<script setup lang="ts">
import { computed, ref } from 'vue'
import OrganicAvatar from '../avatar/OrganicAvatar.vue'
import PresenceDot from './PresenceDot.vue'
import type { Participant } from '../../composables/useToday'
import { AVATAR_FILL_TOKENS, createAvatarRecipe } from '../../lib/avatar/avatar'
import { carLabel, floatDelay, type CarAssignment } from '../../lib/carpool'
import { messageTextClass } from '../../lib/profile'

const props = withDefaults(defineProps<{ car: CarAssignment; onlineUserIds?: Set<string> }>(), {
  onlineUserIds: () => new Set<string>(),
})

/** Wider cars wrap into a second window row, so big capacities read as a van. */
const SEATS_PER_ROW = 5

const occupants = computed<Participant[]>(() => [props.car.driver, ...props.car.passengers])
const emptySeats = computed(() => Array.from({ length: props.car.emptySeats }, (_, i) => i))
const label = computed(() => carLabel(props.car))
const expandedParticipantIds = ref(new Set<string>())

const participantInitial = (person: Participant) =>
  Array.from(person.display_name.trim())[0]?.toLocaleUpperCase('it-IT') ?? '?'

const participantLabel = (person: Participant, index: number) =>
  index === 0 ? `${person.display_name}, alla guida` : person.display_name

const toggleParticipant = (id: string) => {
  const next = new Set(expandedParticipantIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedParticipantIds.value = next
}

// The car wears its driver's avatar color.
const paint = computed(() => {
  const { color } = createAvatarRecipe(props.car.driver.avatar_seed, props.car.driver.avatar_color)
  return { '--car-paint': AVATAR_FILL_TOKENS[color] }
})
const seatGrid = computed(() => ({
  gridTemplateColumns: `repeat(${Math.min(props.car.capacity, SEATS_PER_ROW)}, 2.5rem)`,
}))
</script>

<template>
  <li class="flex max-w-full flex-col items-center gap-3" data-testid="carpool-car">
    <div role="group" :aria-label="label" class="carpool-car" :style="paint">
      <div class="carpool-car__cabin">
        <div class="grid gap-1.5" :style="seatGrid">
          <div
            v-for="(person, index) in occupants"
            :key="person.id"
            class="carpool-car__seat carpool-occupied-seat"
            :data-seat="index === 0 ? 'driver' : 'passenger'"
            data-testid="carpool-occupant"
          >
            <p
              v-if="person.message"
              class="speech-bubble speech-bubble--down carpool-drift carpool-seat-bubble"
              :class="`carpool-seat-bubble--lane-${index % 2}`"
              :style="{ animationDelay: floatDelay(person.id) }"
            >
              <span :class="messageTextClass(person.message_text_color)">{{ person.message }}</span>
            </p>
            <button
              type="button"
              class="participant-avatar-control"
              :class="{
                'participant-avatar-control--expanded': expandedParticipantIds.has(person.id),
              }"
              :aria-label="participantLabel(person, index)"
              :aria-expanded="expandedParticipantIds.has(person.id)"
              @click="toggleParticipant(person.id)"
            >
              <span class="participant-avatar-control__avatar">
                <OrganicAvatar :seed="person.avatar_seed" :color="person.avatar_color" :size="34" />
              </span>
              <span class="participant-avatar-control__initial" aria-hidden="true">
                {{ participantInitial(person) }}
              </span>
              <PresenceDot :online="onlineUserIds.has(person.id)" />
              <span class="participant-avatar-control__name" aria-hidden="true">
                {{ person.display_name }}
              </span>
            </button>
            <!-- Steering wheel marks the driver seat. -->
            <svg
              v-if="index === 0"
              class="absolute -right-1 -bottom-1 size-3.5 text-base-content"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="6.5" fill="var(--color-base-100)" />
              <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path d="M3 8h10M8 8v5" stroke="currentColor" stroke-width="1.6" />
            </svg>
          </div>
          <span
            v-for="seat in emptySeats"
            :key="`empty-${seat}`"
            class="carpool-car__seat carpool-car__seat--empty"
            data-seat="empty"
          >
            <span class="carpool-car__empty" role="img" aria-label="Posto libero"></span>
          </span>
        </div>
      </div>
      <div class="carpool-car__body"></div>
      <span class="carpool-car__wheel left-5" aria-hidden="true"></span>
      <span class="carpool-car__wheel right-5" aria-hidden="true"></span>
    </div>
  </li>
</template>
