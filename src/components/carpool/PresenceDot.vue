<script setup lang="ts">
defineProps<{ online: boolean }>()
</script>

<template>
  <span
    class="inline-block size-2 shrink-0 rounded-full"
    :class="online ? 'bg-success' : 'bg-base-300'"
    :aria-label="online ? 'Online' : 'Offline'"
    role="img"
  ></span>
</template>
