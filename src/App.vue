<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-slate-800 text-white px-4 py-3 shadow-md">
      <div class="max-w-4xl mx-auto text-center font-bold text-3xl">
        Bussruter i sanntid
      </div>
    </header>

    <main class="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
      <BusDashboard />
    </main>

  </div>
</template>

<script setup>
import BusDashboard from './components/BusDashboard.vue';
</script>
