<template>
  <section>
    <div class="flex items-center gap-3 mb-4">
      <button
        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-sm text-slate-700 bg-white hover:bg-slate-50"
        @click="$router.back()"
      >
        ← Tilbake
      </button>
      <div>
        <h1 class="text-xl font-semibold text-slate-800">
          {{ stopDisplayName }}
        </h1>
        <p class="text-xs text-slate-500 break-all">
          StopPlace-id: {{ stopId }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex items-center gap-2 text-slate-600 mb-4">
      <span
        class="animate-spin inline-block w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full"
      ></span>
      <span>Laster avgangar frå Entur…</span>
    </div>

    <p
      v-if="error"
      class="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"
    >
      {{ error }}
    </p>

    <div
      v-if="
        !loading &&
        !error &&
        (!stopPlace || !stopPlace.estimatedCalls || stopPlace.estimatedCalls.length === 0)
      "
      class="text-sm text-slate-600"
    >
      Ingen planlagde avgangar den neste timen.
    </div>

    <ul
      v-if="
        !loading &&
        !error &&
        stopPlace &&
        stopPlace.estimatedCalls &&
        stopPlace.estimatedCalls.length
      "
      class="space-y-3"
    >
      <li
        v-for="(call, index) in stopPlace.estimatedCalls.slice(0, 5)"
        :key="index"
        class="bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <div>
          <p class="text-sm font-medium text-slate-800">
            {{ call.destinationDisplay?.frontText || 'Ukjent destinasjon' }}
          </p>
          <p class="text-xs text-slate-500">
            Linje:
            <span class="font-semibold">
              {{
                call.serviceJourney?.line?.publicCode ||
                call.serviceJourney?.line?.name ||
                'Ukjent'
              }}
            </span>
          </p>
        </div>

        <div class="text-right">
          <p class="text-sm font-semibold text-slate-800">
            {{
              formattedExpectedTime(
                call.expectedDepartureTime || call.aimedDepartureTime,
              )
            }}
          </p>
          <p
            class="text-xs"
            :class="call.realtime ? 'text-emerald-600' : 'text-slate-500'"
          >
            <span v-if="call.realtime">Sanntid</span>
            <span v-else>Planlagt</span>
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getDeparturesForStopPlace } from '../services/enturService';

const route = useRoute();

const stopId = route.params.id;
const stopPlace = ref(null);
const loading = ref(false);
const error = ref('');

const stopDisplayName = computed(() => {
  return route.query.name || stopPlace.value?.name || 'Bussstopp';
});

function formattedExpectedTime(isoString) {
  if (!isoString) return 'Ukjent tidspunkt';
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await getDeparturesForStopPlace(stopId);
    stopPlace.value = data;
  } catch (e) {
    console.error(e);
    error.value =
      'Klarte ikkje å hente avgangar frå Entur. Kontroller nettverk og API-klientnamn.';
  } finally {
    loading.value = false;
  }
});
</script>
