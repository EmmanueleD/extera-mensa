<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useProfile } from '../../composables/useProfile'
import { captureFocus, focusField, restoreFocus } from '../../lib/focus'
import {
  isMessageTextColor,
  messageTextClass,
  MESSAGE_TEXT_COLORS,
  MESSAGE_TEXT_PALETTE,
  PROFILE_MESSAGE_MAX,
  validateProfileMessage,
  type MessageTextColor,
} from '../../lib/profile'

const props = defineProps<{
  open: boolean
  message: string | null
  messageTextColor: string
}>()
const emit = defineEmits<{ close: []; saved: []; removed: [] }>()

const profile = useProfile()
const textarea = ref()
const draftMessage = ref('')
const draftColor = ref<MessageTextColor>(MESSAGE_TEXT_COLORS.INK)
const fieldError = ref<string | null>(null)
let trigger: ReturnType<typeof captureFocus> = null

const messageLength = computed(() => draftMessage.value.trim().length)

function syncDraft() {
  draftMessage.value = props.message ?? ''
  draftColor.value = isMessageTextColor(props.messageTextColor)
    ? props.messageTextColor
    : MESSAGE_TEXT_COLORS.INK
  fieldError.value = null
}

function restoreTriggerFocus() {
  restoreFocus(trigger)
  trigger = null
}

function close() {
  restoreTriggerFocus()
  emit('close')
}

async function save() {
  fieldError.value = validateProfileMessage(draftMessage.value)
  if (fieldError.value) return

  const saved = await profile.update({
    message: draftMessage.value.trim() || null,
    message_text_color: draftColor.value,
  })
  if (saved) {
    restoreTriggerFocus()
    emit('saved')
  }
}

async function remove() {
  const removed = await profile.update({
    message: null,
    message_text_color: draftColor.value,
  })
  if (removed) {
    restoreTriggerFocus()
    emit('removed')
  }
}

watch(
  () => props.open,
  async (isOpen, wasOpen) => {
    if (isOpen) {
      trigger = captureFocus()
      profile.resetError?.()
      syncDraft()
      await nextTick()
      focusField(textarea.value)
    } else if (wasOpen) {
      restoreTriggerFocus()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="open" class="message-editor fixed inset-0 z-50 grid place-items-center p-4">
    <button
      class="absolute inset-0 cursor-default bg-neutral/40"
      type="button"
      aria-label="Chiudi l'editor del messaggio"
      tabindex="-1"
      @click="close"
    ></button>
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="message-editor-title"
      class="message-editor__panel organic-card relative z-10 w-full max-w-md shadow-2xl"
      @keydown.esc.stop.prevent="close"
    >
      <header class="flex items-center justify-between gap-4">
        <h2 id="message-editor-title" class="text-xl font-black">Modifica il tuo messaggio</h2>
        <button class="btn btn-ghost btn-sm" type="button" aria-label="Chiudi" @click="close">
          ✕
        </button>
      </header>

      <form class="mt-5 space-y-5" @submit.prevent="save">
        <label class="form-control block">
          <span class="label-text font-bold">Messaggio</span>
          <textarea
            ref="textarea"
            v-model="draftMessage"
            class="textarea textarea-bordered mt-1 w-full"
            rows="3"
            aria-describedby="message-editor-count"
          ></textarea>
          <span
            id="message-editor-count"
            class="label-text-alt mt-1"
            :class="messageLength > PROFILE_MESSAGE_MAX ? 'text-error' : 'text-base-content/60'"
          >
            {{ messageLength }}/{{ PROFILE_MESSAGE_MAX }}
          </span>
        </label>

        <fieldset>
          <legend class="font-bold">Colore del messaggio</legend>
          <div class="mt-2 flex flex-wrap gap-2">
            <label
              v-for="color in MESSAGE_TEXT_PALETTE"
              :key="color"
              class="message-editor__color-option label cursor-pointer justify-start gap-2 rounded-box border border-base-300 px-3"
            >
              <input
                v-model="draftColor"
                class="radio radio-sm"
                type="radio"
                name="messageTextColor"
                :value="color"
                :aria-label="`Colore del messaggio ${color}`"
              />
              <span :class="messageTextClass(color)">Aa</span>
            </label>
          </div>
        </fieldset>

        <p v-if="fieldError" role="alert" class="alert alert-error text-sm">{{ fieldError }}</p>
        <p v-else-if="profile.error.value" role="alert" class="alert alert-error text-sm">
          {{ profile.error.value }}
        </p>

        <div class="message-editor__actions flex flex-wrap justify-end gap-2">
          <button
            class="btn btn-ghost"
            type="button"
            data-action="remove-message"
            :disabled="profile.saving.value"
            @click="remove"
          >
            Rimuovi
          </button>
          <button class="btn btn-primary" type="submit" :disabled="profile.saving.value">
            Salva
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
