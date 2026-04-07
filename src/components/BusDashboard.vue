<template>
  <section ref="dashboardEl" class="h-[calc(100vh-164px)] flex flex-col">

    <p
      v-if="globalError"
      class="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2"
    >
      {{ globalError }}
    </p>

    <div class="grid gap-4 sm:grid-cols-2 flex-1 min-h-0">
      <article
        v-for="card in cards"
        :key="card.key"
        class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0"
      >
        <div class="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 class="font-semibold text-slate-800 leading-tight">
              {{ card.title }}
            </h2>
            <p class="text-xs text-slate-500 break-all">
            </p>
          </div>
        </div>

        <div ref="cardBodyEls" class="px-4 py-3 flex-1 min-h-0 overflow-hidden">
          <div v-if="card.loading" class="flex items-center gap-2 text-slate-600">
            <span
              class="animate-spin inline-block w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full"
            ></span>
            <span class="text-sm">Laster avgangar…</span>
          </div>

          <p
            v-else-if="card.error"
            class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2"
          >
            {{ card.error }}
          </p>

          <p
            v-else-if="!card.calls.length"
            class="text-sm text-slate-600"
          >
            Ingen avgangar i den neste timen.
          </p>

          <ul v-else class="space-y-3">
            <li
              v-for="(call, idx) in card.calls.slice(0, maxCallsPerCard)"
              :key="idx"
              class="flex items-center justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate">
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

              <div class="text-right shrink-0">
                <p class="text-sm font-semibold text-slate-800">
                  {{ formatTime(call.expectedDepartureTime || call.aimedDepartureTime) }}
                </p>
                <p
                  class="text-xs"
                  :class="call.realtime ? 'text-emerald-600' : 'text-slate-500'"
                >
                  {{ call.realtime ? 'Sanntid' : 'Planlagt' }}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { getStopPlacesForNames, getDeparturesForStopPlace } from '../services/enturService';

const requestedStopNames = [
  'Volsdalsberga',
  'Nørvegata vest',
  'Blixvalen',
  'Øfstisvingen',
];

const globalError = ref('');
const refreshing = ref(false);
const maxCallsPerCard = ref(6);

const dashboardEl = ref(null);
const cardBodyEls = ref([]);

const cards = ref(
  requestedStopNames.map((name) => ({
    key: name,
    requestedName: name,
    title: name,
    stopPlaceId: null,
    loading: true,
    error: '',
    calls: [],
  })),
);

function formatTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

async function hydrateStopPlaceIds() {
  globalError.value = '';
  const lookups = await getStopPlacesForNames(requestedStopNames);

  for (const lookup of lookups) {
    const card = cards.value.find((c) => c.requestedName === lookup.requestedName);
    if (!card) continue;
    card.stopPlaceId = lookup.id;
    card.title = lookup.resolvedName || lookup.requestedName;
    card.error = lookup.error || '';
  }
}

async function refreshDeparturesForCard(card) {
  card.loading = true;
  card.error = '';
  card.calls = [];

  if (!card.stopPlaceId) {
    card.loading = false;
    card.error = card.error || 'Manglar StopPlace-id for denne haldeplassen.';
    return;
  }

  try {
    const stopPlace = await getDeparturesForStopPlace(card.stopPlaceId);
    card.title = stopPlace?.name || card.title;
    card.calls = stopPlace?.estimatedCalls || [];
  } catch (e) {
    console.error(e);
    card.error = 'Klarte ikkje å hente avgangar frå Entur.';
  } finally {
    card.loading = false;
  }
}

async function refreshAll() {
  if (refreshing.value) return;
  refreshing.value = true;
  globalError.value = '';

  try {
    await hydrateStopPlaceIds();
    await Promise.all(cards.value.map((c) => refreshDeparturesForCard(c)));
  } catch (e) {
    console.error(e);
    globalError.value =
      'Klarte ikkje å oppdatere dashboardet. Sjekk nettverk og ET-Client-Name.';
  } finally {
    refreshing.value = false;
  }
}

function computeMaxCallsPerCard() {
  const el = cardBodyEls.value?.[0];
  if (!el) return;

  // Omtrentlig høgde per avgangsrad (inkl. space-y-3) i px.
  // Vi held dette konservativt for å unngå scrolling.
  const headerReserve = 10; // litt luft
  const rowHeight = 52;

  const available = Math.max(0, el.clientHeight - headerReserve);
  const fit = Math.floor(available / rowHeight);

  // Minimum 2, maksimum 12 for å halde UI ryddig.
  maxCallsPerCard.value = Math.min(12, Math.max(2, fit));
}

let intervalId = null;
let resizeObserver = null;

onMounted(async () => {
  await refreshAll();
  await nextTick();
  computeMaxCallsPerCard();

  resizeObserver = new ResizeObserver(() => computeMaxCallsPerCard());
  if (dashboardEl.value) resizeObserver.observe(dashboardEl.value);
  for (const el of cardBodyEls.value || []) {
    if (el) resizeObserver.observe(el);
  }

  intervalId = window.setInterval(() => {
    refreshAll();
  }, 30000);
});

onBeforeUnmount(() => {
  if (intervalId) window.clearInterval(intervalId);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

