export type GeoTag = {
  available: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  capturedAt?: string;
  reason?: string;
};

export function getCurrentLocation(timeoutMs = 10000): Promise<GeoTag> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ available: false, reason: "geolocation-not-supported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          available: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
      },
      (error) => {
        resolve({
          available: false,
          reason: error?.code === 1 ? "permission-denied" : `position-unavailable:${error?.code ?? "unknown"}`,
        });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

export function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
