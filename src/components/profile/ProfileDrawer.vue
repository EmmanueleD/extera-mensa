<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import OrganicAvatar from '../avatar/OrganicAvatar.vue'
import {
  AVATAR_COLORS,
  AVATAR_FILL_TOKENS,
  AVATAR_PALETTE,
  regenerateAvatarSeed,
} from '../../lib/avatar/avatar'
import { PROFILE_DISPLAY_NAME_MAX, validateDisplayName } from '../../lib/profile'
import { useProfile } from '../../composables/useProfile'
import { captureFocus, focusField, restoreFocus } from '../../lib/focus'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const profile = useProfile()
const nameInput = ref()
const displayName = ref('')
const avatarSeed = ref('')
const avatarColor = ref<string>(AVATAR_COLORS.CORAL)
const fieldError = ref<string | null>(null)
let previouslyFocused: ReturnType<typeof captureFocus> = null

function syncDraft() {
  const current = profile.profile.value
  displayName.value = current?.display_name ?? ''
  avatarSeed.value = current?.avatar_seed ?? ''
  avatarColor.value = current?.avatar_color ?? AVATAR_COLORS.CORAL
  fieldError.value = null
}

async function initialize() {
  previouslyFocused = captureFocus()
  await profile.load()
  syncDraft()
  await nextTick()
  focusField(nameInput.value)
}

function close() {
  restoreFocus(previouslyFocused)
  emit('close')
}

function regenerate() {
  // Only the seed changes; selected colors are retained.
  avatarSeed.value = regenerateAvatarSeed()
}

async function save() {
  fieldError.value = validateDisplayName(displayName.value)
  if (fieldError.value) return
  const saved = await profile.update({
    display_name: displayName.value.trim(),
    avatar_seed: avatarSeed.value,
    avatar_color: avatarColor.value,
  })
  if (saved) close()
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) void initialize()
  },
)
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-40 flex justify-end">
    <button
      class="absolute inset-0 cursor-default bg-neutral/40"
      type="button"
      aria-label="Chiudi il profilo"
      tabindex="-1"
      @click="close"
    ></button>
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      class="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-base-100 p-6 shadow-2xl"
      @keydown.esc.stop="close"
    >
      <header class="flex items-center justify-between gap-4">
        <h2 id="profile-title" class="text-2xl font-black">Il tuo profilo</h2>
        <button class="btn btn-ghost btn-sm" type="button" aria-label="Chiudi" @click="close">
          ✕
        </button>
      </header>

      <div
        v-if="profile.loading.value"
        class="loading loading-dots mx-auto my-16"
        aria-label="Caricamento profilo"
      ></div>

      <form v-else class="mt-6 flex flex-1 flex-col gap-5" @submit.prevent="save">
        <div class="flex items-center gap-4">
          <OrganicAvatar
            :seed="avatarSeed"
            :color="avatarColor"
            :size="72"
            label="Anteprima avatar"
          />
          <button
            class="btn btn-outline btn-sm"
            type="button"
            data-action="regenerate"
            @click="regenerate"
          >
            Rigenera avatar
          </button>
        </div>

        <label class="form-control block">
          <span class="label-text font-bold">Nome</span>
          <input
            ref="nameInput"
            v-model="displayName"
            class="input input-bordered mt-1 w-full"
            type="text"
            autocomplete="nickname"
            :maxlength="PROFILE_DISPLAY_NAME_MAX"
            required
          />
        </label>

        <fieldset>
          <legend class="font-bold">Colore avatar</legend>
          <div class="mt-2 flex flex-wrap gap-3">
            <label v-for="color in AVATAR_PALETTE" :key="color" class="cursor-pointer">
              <input
                v-model="avatarColor"
                class="sr-only"
                type="radio"
                name="avatarColor"
                :value="color"
                :aria-label="`Colore avatar ${color}`"
              />
              <span
                class="block size-9 rounded-full ring-offset-2 ring-offset-base-100"
                :class="avatarColor === color ? 'ring-2 ring-primary' : ''"
                :style="{ backgroundColor: AVATAR_FILL_TOKENS[color] }"
              ></span>
            </label>
          </div>
        </fieldset>

        <p v-if="fieldError" role="alert" class="alert alert-error text-sm">{{ fieldError }}</p>
        <p v-else-if="profile.error.value" role="alert" class="alert alert-error text-sm">
          {{ profile.error.value }}
        </p>

        <div class="mt-auto flex gap-2 pt-6">
          <button class="btn btn-primary flex-1" type="submit" :disabled="profile.saving.value">
            <span
              v-if="profile.saving.value"
              class="loading loading-spinner loading-sm"
              aria-hidden="true"
            ></span>
            Salva
          </button>
          <button class="btn btn-ghost" type="button" @click="close">Annulla</button>
        </div>
      </form>
    </section>
  </div>
</template>
