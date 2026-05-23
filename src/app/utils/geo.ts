export function getStableCoords(id: string, text: string): { latitude: number; longitude: number } {
  const input = `${id}-${text}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 16.054404 + ((hash % 100) / 1000);
  const lon = 108.202167 + (((hash >> 2) % 100) / 1000);
  return { latitude: lat, longitude: lon };
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateDeliveryFee(distance: number): number {
  if (distance <= 2) {
    return 15000;
  }
  const additionalKm = Math.ceil(distance - 2);
  return 15000 + additionalKm * 5000;
}

export function getDeliveryTimeRange(distance: number | null): { min: number; max: number } {
  if (distance === null || distance === Infinity) {
    return { min: 20, max: 30 };
  }
  const minTime = Math.max(15, Math.round(15 + distance * 2));
  const maxTime = Math.max(20, Math.round(20 + distance * 3));
  return { min: minTime, max: maxTime };
}

export function getDeliveryTimeText(distance: number | null): string {
  const { min, max } = getDeliveryTimeRange(distance);
  return `${min}-${max} min`;
}

