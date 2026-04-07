# Bussruter i sanntid (Entur + Vue 3)

Lite dashboard som viser sanntidsavgangar frå Entur for utvalde haldeplassar i Ålesund.

## Krav
- Node.js (LTS)

## Kom i gang

1. Installer avhengigheiter:
   ```bash
   npm install
   ```

2. Set `ET-Client-Name` i `src/services/enturService.js` (format: `firma-app`).

3. Start utviklingsserver:
   ```bash
   npm run dev
   ```

## API
- Journey Planner v3 (GraphQL): `https://api.entur.io/journey-planner/v3/graphql`
- Geocoder (autocomplete): `https://api.entur.io/geocoder/v1/autocomplete`

