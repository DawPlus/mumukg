import type { Restaurant } from './types';
const STORAGE_KEY = 'mumukg.restaurants.v1';
export function loadRestaurants(): Restaurant[] { if (typeof window === 'undefined') return []; try { const raw = localStorage.getItem(STORAGE_KEY); const data: unknown = raw ? JSON.parse(raw) : []; return Array.isArray(data) ? data.filter((item): item is Restaurant => Boolean(item && typeof item === 'object' && 'id' in item && 'latitude' in item && 'longitude' in item)) : []; } catch { return []; } }
export function saveRestaurants(items: Restaurant[]) { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
