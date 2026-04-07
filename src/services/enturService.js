const ENTUR_GRAPHQL_ENDPOINT =
  'https://api.entur.io/journey-planner/v3/graphql';
const ENTUR_GEOCODER_ENDPOINT =
  'https://api.entur.io/geocoder/v1/autocomplete';

// BYTT denne til noko unikt for deg, t.d. "andreas-busapp"
const ENTUR_CLIENT_NAME = 'andre-buss';

async function fetchEnturGraphQL(query, variables = {}) {
  const response = await fetch(ENTUR_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ET-Client-Name': ENTUR_CLIENT_NAME,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Entur API-feil: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors && json.errors.length) {
    const messages = json.errors.map((e) => e.message).join(', ');
    throw new Error(`Entur GraphQL-feil: ${messages}`);
  }

  return json.data;
}

async function fetchEnturGeocoder(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'ET-Client-Name': ENTUR_CLIENT_NAME,
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(
      `Entur geocoder-feil: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

// Hentar avgangar for eit StopPlace-id (GraphQL Journey Planner v3).
const DEPARTURES_BY_STOP_ID_QUERY = `
  query($id: String!) {
    stopPlace(id: $id) {
      id
      name
      estimatedCalls(timeRange: 3600, numberOfDepartures: 10) {
        aimedDepartureTime
        expectedDepartureTime
        realtime
        destinationDisplay {
          frontText
        }
        serviceJourney {
          line {
            id
            name
            publicCode
          }
        }
      }
    }
  }
`;

export async function getDeparturesForStopPlace(stopPlaceId) {
  const data = await fetchEnturGraphQL(DEPARTURES_BY_STOP_ID_QUERY, {
    id: stopPlaceId,
  });

  return data.stopPlace;
}

// Slår opp StopPlace-id ved hjelp av Entur Geocoder (REST-API).
// Brukar autocomplete-endepunktet og vel det første treffet som ser ut som ein StopPlace.
export async function getStopPlacesForNames(stopNames) {
  const results = [];

  async function lookupStopPlaceId(text) {
    const url =
      `${ENTUR_GEOCODER_ENDPOINT}?text=${encodeURIComponent(text)}` +
      '&lang=nb&size=5';

    // Enkel retry (nettverksglipp / connection closed).
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const data = await fetchEnturGeocoder(url);
        const features = data.features || [];
        if (!features.length) return null;

        const stopFeature =
          features.find((f) =>
            String(f.properties?.id || '').includes('StopPlace'),
          ) || features[0];

        return {
          id: stopFeature.properties?.id || null,
          name: stopFeature.properties?.name || null,
        };
      } catch (e) {
        lastError = e;
        // kort pause før nytt forsøk
        await new Promise((r) => setTimeout(r, 250 * attempt));
      }
    }
    throw lastError;
  }

  for (const name of stopNames) {
    try {
      // 1) Prøv direkte
      let hit = await lookupStopPlaceId(name);
      // 2) Fallback: legg til stad for å hjelpe geocoder og redusere rare nettverksglipp
      if (!hit) hit = await lookupStopPlaceId(`${name} Ålesund`);

      if (!hit || !hit.id) {
        results.push({
          requestedName: name,
          id: null,
          resolvedName: null,
          error: 'Fant ingen stopp med dette namnet',
        });
        continue;
      }

      results.push({
        requestedName: name,
        id: hit.id,
        resolvedName: hit.name || name,
        error: null,
      });
    } catch (e) {
      console.error(e);
      results.push({
        requestedName: name,
        id: null,
        resolvedName: null,
        error: 'Feil ved oppslag i Entur geocoder (nettverksfeil)',
      });
    }
  }

  return results;
}
