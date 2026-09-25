<script setup lang="ts">
import { computed } from 'vue'
import { AVATAR_FILL_TOKENS, createAvatarRecipe } from '../../lib/avatar/avatar'
import { useReducedMotion } from '../../composables/useReducedMotion'

const props = withDefaults(
  defineProps<{
    seed: string
    color: string
    /** Accessible name. When omitted the avatar is decorative. */
    label?: string
    size?: number
  }>(),
  {
    label: undefined,
    size: 48,
  },
)

const recipe = computed(() => createAvatarRecipe(props.seed, props.color))
const geometry = computed(() => recipe.value.geometry)
const fill = computed(() => AVATAR_FILL_TOKENS[recipe.value.color])
const prefersReducedMotion = useReducedMotion()
const animated = computed(() => !prefersReducedMotion.value)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    class="shrink-0"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
    :data-avatar-variant="recipe.variant"
    :data-avatar-scale="geometry.scale"
  >
    <g :transform="`rotate(${geometry.tilt} 50 50)`">
      <g :class="animated ? 'avatar-breathe' : undefined">
        <g :transform="`translate(50 50) scale(${geometry.scale}) translate(-50 -50)`">
          <path class="avatar-silhouette" :d="geometry.silhouette" :fill="fill" />
          <circle
            v-for="(spot, index) in geometry.spots"
            :key="`spot-${index}`"
            class="avatar-spot"
            :cx="spot.cx"
            :cy="spot.cy"
            :r="spot.r"
            fill="var(--color-base-content)"
            :opacity="spot.opacity"
          />
          <path :d="geometry.highlight" fill="var(--color-base-100)" opacity="0.35" />
          <circle
            v-for="(eye, index) in geometry.eyes"
            :key="`eye-${index}`"
            :cx="eye.cx"
            :cy="eye.cy"
            :r="eye.r"
            fill="var(--color-base-content)"
          />
          <path
            :d="geometry.mouth"
            fill="none"
            stroke="var(--color-base-content)"
            stroke-width="3.2"
            stroke-linecap="round"
          />
          <g
            v-if="geometry.decoration"
            class="avatar-decoration"
            :data-decoration="geometry.decoration.kind"
          >
            <circle
              v-for="(mark, index) in geometry.decoration.marks"
              :key="`decoration-${index}`"
              :cx="mark.cx"
              :cy="mark.cy"
              :r="mark.r"
              fill="var(--color-accent)"
              opacity="0.65"
            />
            <path
              v-if="geometry.decoration.path"
              :d="geometry.decoration.path"
              fill="var(--color-accent)"
            />
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>
