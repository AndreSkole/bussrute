<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-slate-800 text-white px-4 py-3 shadow-md">
      <div
        class="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <div
          class="text-xl font-semibold tracking-tight"
        >
          Bussruter i sanntid
        </div>
        <p class="text-sm text-slate-300">
          Entur • Volsdalsberga • Nørvegata vest • Blixvalen • Øfstisvingen
        </p>
      </div>
    </header>

    <main class="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
      <BusDashboard />
    </main>

    <footer class="bg-slate-900 text-slate-400 text-xs py-3 px-4 mt-4">
      <div
        class="max-w-4xl mx-auto flex flex-col sm:flex-row sm:justify-between gap-1"
      >
        <span>Data frå Entur (journey-planner v3)</span>
        <span>Bygd med Vue 3 • Composition API</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import BusDashboard from './components/BusDashboard.vue';
</script>
