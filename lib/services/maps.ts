export type LatLng = { lat: number; lng: number }

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
const DISTANCE_MATRIX_URL =
  "https://maps.googleapis.com/maps/api/distancematrix/json"

/** Whether the server-side Google Maps integration (Geocoding +
 * Distance Matrix) has an API key configured. Every function below is a
 * no-op returning null when it doesn't — callers fall back to manual
 * zone selection instead of crashing. */
export function isMapsConfigured() {
  return Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY)
}

/** The Maps JavaScript API key, used client-side to render the actual map
 * widget (address confirmation on checkout) — distinct from the
 * server-only key above, which only powers the geocode/distance lookups. */
export function isMapsClientConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
}

export async function geocodeAddress(
  addressLine: string,
): Promise<LatLng | null> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) {
    console.error("[maps] geocodeAddress: GOOGLE_MAPS_SERVER_API_KEY is not set")
    return null
  }

  const url = new URL(GEOCODE_URL)
  url.searchParams.set("address", addressLine)
  url.searchParams.set("region", "br")
  url.searchParams.set("key", apiKey)

  try {
    const res = await fetch(url.toString())
    if (!res.ok) {
      console.error("[maps] geocodeAddress: HTTP", res.status, await res.text())
      return null
    }
    const data = await res.json()
    const location = data?.results?.[0]?.geometry?.location
    if (typeof location?.lat !== "number" || typeof location?.lng !== "number") {
      console.error("[maps] geocodeAddress failed", data?.status, data?.error_message)
      return null
    }
    return { lat: location.lat, lng: location.lng }
  } catch (err) {
    console.error("[maps] geocodeAddress threw", err)
    return null
  }
}

/** Real route distance (not straight-line) between two points, in km. */
export async function getRouteDistanceKm(
  origin: LatLng,
  destination: LatLng,
): Promise<number | null> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) {
    console.error("[maps] getRouteDistanceKm: GOOGLE_MAPS_SERVER_API_KEY is not set")
    return null
  }

  const url = new URL(DISTANCE_MATRIX_URL)
  url.searchParams.set("origins", `${origin.lat},${origin.lng}`)
  url.searchParams.set("destinations", `${destination.lat},${destination.lng}`)
  url.searchParams.set("key", apiKey)

  try {
    const res = await fetch(url.toString())
    if (!res.ok) {
      console.error("[maps] getRouteDistanceKm: HTTP", res.status, await res.text())
      return null
    }
    const data = await res.json()
    const element = data?.rows?.[0]?.elements?.[0]
    if (element?.status !== "OK") {
      console.error(
        "[maps] getRouteDistanceKm failed",
        data?.status,
        data?.error_message,
        element?.status,
      )
      return null
    }
    return element.distance.value / 1000
  } catch (err) {
    console.error("[maps] getRouteDistanceKm threw", err)
    return null
  }
}
