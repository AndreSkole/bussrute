<template>
  <section>
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"
    >
      <h1 class="text-2xl font-semibold text-slate-800">
        Bussstopp
      </h1>

      <input
        v-model="search"
        type="text"
        placeholder="Søk etter bussstopp…"
        class="w-full sm:w-64 px-3 py-2 rounded-md border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
      />
    </div>

    <div v-if="loading" class="flex items-center gap-2 text-slate-600 mb-4">
      <span
        class="animate-spin inline-block w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full"
      ></span>
      <span>Laster bussstopp frå Entur…</span>
    </div>

    <p
      v-if="error"
      class="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"
    >
      {{ error }}
    </p>

    <p
      v-if="!loading && !error && filteredStops.length === 0"
      class="text-slate-600 text-sm"
    >
      Ingen bussstopp funne. Prøv å endre søket.
    </p>

    <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
      <li
        v-for="stop in filteredStops"
        :key="stop.id || stop.requestedName"
      >
        <button
          class="w-full text-left bg-white rounded-lg shadow-sm border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all px-4 py-3 flex flex-col gap-1"
          :disabled="!stop.id"
          @click="goToDetails(stop)"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium text-slate-800">
              {{ stop.resolvedName || stop.requestedName }}
            </span>
            <span
              v-if="stop.id"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200"
            >
              StopPlace-id
            </span>
          </div>

          <p class="text-xs text-slate-500">
            Ønskt namn: {{ stop.requestedName }}
          </p>

          <p
            v-if="stop.error"
            class="mt-1 text-xs text-red-600"
          >
            {{ stop.error }}
          </p>

          <p
            v-else
            class="mt-1 text-xs text-slate-500"
          >
            Trykk for å sjå neste avgangar.
          </p>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getStopPlacesForNames } from '../services/enturService';

const router = useRouter();

const search = ref('');
const loading = ref(false);
const error = ref('');
const stops = ref([]);

const requestedStopNames = [
  'Volsdalsberga',
  'Nørvegata vest',
  'Blixvalen',
  'Øfstisvingen',
];

const filteredStops = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) {
    return stops.value;
  }
  return stops.value.filter((s) => {
    const displayName = (s.resolvedName || s.requestedName || '').toLowerCase();
    return displayName.includes(term);
  });
});

function goToDetails(stop) {
  if (!stop.id) return;
  router.push({
    name: 'BusStopDetails',
    params: { id: stop.id },
    query: { name: stop.resolvedName || stop.requestedName },
  });
}

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const result = await getStopPlacesForNames(requestedStopNames);
    stops.value = result;
  } catch (e) {
    console.error(e);
    error.value =
      'Klarte ikkje å hente bussstopp frå Entur. Sjekk nettverk eller API-klientnamn.';
  } finally {
    loading.value = false;
  }
});
</script>
