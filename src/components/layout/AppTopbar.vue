<template>
  <header
    class="navbar sticky top-0 z-10 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur"
  >
    <div class="flex-1">
      <RouterLink class="text-lg font-black tracking-tight" to="/today">Extera Mensa</RouterLink>
    </div>
    <nav aria-label="Navigazione principale" class="flex gap-1">
      <RouterLink class="btn btn-ghost btn-sm" to="/today">Oggi</RouterLink>
      <RouterLink class="btn btn-ghost btn-sm" to="/statistics">Statistiche</RouterLink>
    </nav>
  </header>
</template>
