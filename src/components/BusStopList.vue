<template>
  <section>
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"
    >
      <h1 class="text-2xl font-semibold text-slate-800">
        Bussstopp
      </h1>
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
