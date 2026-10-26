import type { Restaurant } from './types';
const STORAGE_KEY = 'mumukg.restaurants.v1';
export function loadRestaurants(): Restaurant[] { if (typeof window === 'undefined') return []; try { const raw = localStorage.getItem(STORAGE_KEY); const data: unknown = raw ? JSON.parse(raw) : []; return Array.isArray(data) ? data.filter((item): item is Restaurant => Boolean(item && typeof item === 'object' && 'id' in item && 'latitude' in item && 'longitude' in item)) : []; } catch { return []; } }
export function saveRestaurants(items: Restaurant[]) { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

export function getNearestRestaurants(items: Restaurant[], latitude: number, longitude: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  return items.flatMap((restaurant) => {
    const { latitude: itemLat, longitude: itemLng } = restaurant;
    if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng) || Math.abs(itemLat) > 90 || Math.abs(itemLng) > 180) return [];
    const latDiff = radians(itemLat - latitude);
    const lngDiff = radians(itemLng - longitude);
    const a = Math.min(1, Math.sin(latDiff / 2) ** 2 + Math.cos(radians(latitude)) * Math.cos(radians(itemLat)) * Math.sin(lngDiff / 2) ** 2);
    return [{ restaurant, distanceKm: 6371 * 2 * Math.asin(Math.sqrt(a)) }];
  }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 30);
}
