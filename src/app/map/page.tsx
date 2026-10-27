'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { DepthDrawer } from '@/components/ui/depth-drawer';
import { Zoom } from '@animate-ui/react/primitives/effects/zoom';
import { Input } from '@/components/ui/input';
import { getNearestRestaurants, loadRestaurants, saveRestaurants } from '@/lib/restaurants';
import type { Restaurant } from '@/lib/types';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { foodCategories, getFoodCategory, getFoodIcon, getFoodSubcategory } from '@/lib/food-categories';
import { List, LocateFixed, Save, X } from 'lucide-react';
import './map.css';

type KakaoLatLng = { getLat: () => number; getLng: () => number };
type KakaoBounds = { getSouthWest: () => KakaoLatLng; getNorthEast: () => KakaoLatLng };
type KakaoMarker = { setMap: (map: KakaoMap | null) => void; setPosition: (position: unknown) => void; setImage: (image: unknown) => void };
type KakaoPlace = NonNullable<Restaurant['kakaoPlace']>;
type KakaoPagination = { hasNextPage: boolean; nextPage: () => void };
type KakaoMap = {
  getBounds: () => KakaoBounds;
  setCenter: (position: unknown) => void;
  getProjection: () => { coordsFromContainerPoint: (point: unknown) => KakaoLatLng };
  relayout: () => void;
};

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (element: HTMLElement, options: object) => KakaoMap;
        LatLng: new (lat: number, lng: number) => unknown;
        Point: new (x: number, y: number) => unknown;
        Size: new (width: number, height: number) => unknown;
        MarkerImage: new (src: string, size: unknown, options: object) => unknown;
        Marker: new (options: object) => KakaoMarker;
        event: { addListener: (target: object, event: string, callback: () => void) => void };
        services?: {
          Places: new (map?: KakaoMap) => { categorySearch: (code: string, callback: (results: KakaoPlace[], status: string, pagination: KakaoPagination) => void, options: object) => void };
          Status: { OK: string; ZERO_RESULT: string };
        };
      };
    };
  }
}

const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
const categories = foodCategories;
const longPressMs = 550;
const markerSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="44" viewBox="0 0 38 44"><path d="M19 2C9.6 2 2 9.6 2 19c0 11.5 17 23 17 23s17-11.5 17-23C36 9.6 28.4 2 19 2Z" fill="#38432f" opacity=".3"/><path d="M19 1C9.6 1 2 8.6 2 18c0 11.5 17 23 17 23s17-11.5 17-23C36 8.6 28.4 1 19 1Z" fill="#66734b" stroke="#f7f5ef" stroke-width="2.5"/><circle cx="19" cy="18" r="8" fill="#efe6d4" stroke="#f7f5ef" stroke-width="2"/><circle cx="19" cy="18" r="3" fill="#4d5b3c"/></svg>';
const locationMarkerSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36"><g transform="translate(0 4)"><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0;0 -2;0 0" keyTimes="0;.22;.5;.72;1" dur="1800ms" repeatCount="indefinite"/><path d="M12 1C6.5 1 2 5.5 2 11c0 7 10 18 10 18s10-11 10-18C22 5.5 17.5 1 12 1Z" fill="#66734b" stroke="#fff" stroke-width="2"/><circle cx="12" cy="11" r="4.5" fill="#efe6d4"/><circle cx="12" cy="11" r="1.8" fill="#4d5b3c"/></g></g></svg>';
const savedBadgeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="#efe6d4" stroke="#4d5b3c"/><path d="m6 1.5 1.3 2.7 3 .4-2.2 2.1.5 3L6 8.3l-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#4d5b3c"/></svg>';
type MapDrawerPanel = 'list' | 'detail' | 'registration' | 'feedback';

function makeMarkerImage(maps: NonNullable<Window['kakao']>['maps']) {
  return new maps.MarkerImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg)}`,
    new maps.Size(38, 44),
    { offset: new maps.Point(19, 42), alt: '저장한 맛집 위치 표시' },
  );
}

function makeFoodMarkerImage(maps: NonNullable<Window['kakao']>['maps'], category: string, size: number) {
  return new maps.MarkerImage(getFoodIcon(category), new maps.Size(size, size), {
    offset: new maps.Point(size / 2, size / 2),
    alt: `${category} 음식 아이콘`,
  });
}

function getMonthlyVisits(dates: string[] = []) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    return { label: `${month.getMonth() + 1}월`, count: dates.filter((date) => date.startsWith(key)).length };
  });
}

export default function MapPage() {
  const pathname = usePathname();
  const [items, setItems] = useState<Restaurant[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapCreated, setMapCreated] = useState(false);
  const { location, error: locationError, locate } = useCurrentLocation();
  const [panelStack, setPanelStack] = useState<MapDrawerPanel[]>([]);
  const [visitReason, setVisitReason] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showParcelAddress, setShowParcelAddress] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [canSearchPlaces, setCanSearchPlaces] = useState(true);
  const [mapRange, setMapRange] = useState<{ widthKm: number; heightKm: number } | null>(null);
  const [placesError, setPlacesError] = useState('');
  const [placeInfo, setPlaceInfo] = useState<Pick<Restaurant, 'placeId' | 'address' | 'phone' | 'placeUrl' | 'kakaoPlace'>>({});
  const [name, setName] = useState('');
  const [category, setCategory] = useState('한식');
  const [note, setNote] = useState('');
  const [lat, setLat] = useState(37.5495);
  const [lng, setLng] = useState(126.914);
  const [error, setError] = useState('');
  const mapNodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerImageRef = useRef<unknown>(null);
  const locationMarkerRef = useRef<KakaoMarker | null>(null);
  const pendingMarkerRef = useRef<KakaoMarker | null>(null);
  const restaurantMarkersRef = useRef<KakaoMarker[]>([]);
  const placeSearchMarkersRef = useRef<{ id: string; marker: KakaoMarker }[]>([]);
  const selectedPlaceMarkerRef = useRef<{ marker: KakaoMarker; originalCategory: string } | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const placeSelectionTimer = useRef<number | null>(null);
  const activePointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const placeSearchId = useRef(0);
  const lastSearchedBounds = useRef<{ south: number; west: number; north: number; east: number } | null>(null);
  const activePanel = panelStack.at(-1);
  const panelDepth = panelStack.length;

  function openPanel(panel: MapDrawerPanel) { setPanelStack([panel]); }
  function pushPanel(panel: MapDrawerPanel) { setPanelStack((stack) => [...stack, panel]); }

  function addRestaurantMarker(maps: NonNullable<Window['kakao']>['maps'], map: KakaoMap, item: Restaurant): KakaoMarker[] {
    const position = new maps.LatLng(item.latitude, item.longitude);
    const image = makeFoodMarkerImage(maps, item.category, 20);
    const showRestaurant = () => {
      setSelectedRestaurant(item);
      setShowParcelAddress(false);
      openPanel('detail');
    };
    const marker = new maps.Marker({ map, position, title: item.name, image });
    maps.event.addListener(marker, 'click', showRestaurant);
    const badgeImage = new maps.MarkerImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(savedBadgeSvg)}`,
      new maps.Size(12, 12),
      { offset: new maps.Point(1, 19), alt: '저장한 맛집' },
    );
    const badge = new maps.Marker({ map, position, title: `${item.name} 저장됨`, image: badgeImage, zIndex: 1 });
    maps.event.addListener(badge, 'click', showRestaurant);
    return [marker, badge];
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setItems(loadRestaurants());
      setItemsLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const maps = window.kakao?.maps;
    const node = mapNodeRef.current;
    if (!ready || !itemsLoaded || !maps || !node || mapRef.current) return;
    maps.load(() => {
      if (mapRef.current) return;
      const map = new maps.Map(node, { center: new maps.LatLng(lat, lng), level: 5 });
      mapRef.current = map;
      markerImageRef.current = makeMarkerImage(maps);
      maps.event.addListener(map, 'idle', () => {
        const bounds = map.getBounds();
        const southWest = bounds.getSouthWest();
        const northEast = bounds.getNorthEast();
        const middleLatitude = (southWest.getLat() + northEast.getLat()) / 2;
        setMapRange({
          widthKm: (northEast.getLng() - southWest.getLng()) * 111.32 * Math.cos(middleLatitude * Math.PI / 180),
          heightKm: (northEast.getLat() - southWest.getLat()) * 111.32,
        });
        const searchedBounds = lastSearchedBounds.current;
        if (!searchedBounds) return;
        setCanSearchPlaces(
          southWest.getLat() !== searchedBounds.south || southWest.getLng() !== searchedBounds.west ||
          northEast.getLat() !== searchedBounds.north || northEast.getLng() !== searchedBounds.east,
        );
      });
      setMapCreated(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, itemsLoaded]);

  useEffect(() => {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    if (!mapCreated || !maps || !map) return;
    const center = location ?? (items[0] && { latitude: items[0].latitude, longitude: items[0].longitude });
    if (center) map.setCenter(new maps.LatLng(center.latitude, center.longitude));
  }, [items, mapCreated, location]);

  useEffect(() => {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    if (!mapCreated || !maps || !map || !location) return;
    const position = new maps.LatLng(location.latitude, location.longitude);
    if (!locationMarkerRef.current) {
      const image = new maps.MarkerImage(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(locationMarkerSvg)}`,
        new maps.Size(24, 36),
        { offset: new maps.Point(12, 33), alt: '내 현재 위치' },
      );
      locationMarkerRef.current = new maps.Marker({ map, position, image, title: '내 현재 위치', zIndex: 10 });
    } else {
      locationMarkerRef.current.setPosition(position);
      locationMarkerRef.current.setMap(map);
    }
    return () => locationMarkerRef.current?.setMap(null);
  }, [location, mapCreated]);

  useEffect(() => {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    if (!mapCreated || !maps || !map) return;
    const restaurants = location
      ? getNearestRestaurants(items, location.latitude, location.longitude).map(({ restaurant }) => restaurant)
      : items.slice(0, 30);
    restaurantMarkersRef.current = restaurants.flatMap((restaurant) => addRestaurantMarker(maps, map, restaurant));
    return () => {
      restaurantMarkersRef.current.forEach((marker) => marker.setMap(null));
      restaurantMarkersRef.current = [];
    };
  }, [items, location, mapCreated]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => mapRef.current?.relayout());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => () => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
    if (placeSelectionTimer.current !== null) window.clearTimeout(placeSelectionTimer.current);
    placeSearchId.current += 1;
    placeSearchMarkersRef.current.forEach(({ marker }) => marker.setMap(null));
  }, []);

  function cancelLongPress() {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    activePointer.current = null;
  }

  function openRegistration(latitude: number, longitude: number) {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    if (!maps || !map) return;
    const position = new maps.LatLng(latitude, longitude);
    setLat(latitude);
    setLng(longitude);
    setName('');
    setCategory('한식');
    setNote('');
    setPlaceInfo({});
    setPlacesError('');
    setSelectedRestaurant(null);
    setError('');
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.setPosition(position);
      pendingMarkerRef.current.setImage(makeFoodMarkerImage(maps, '한식', 22));
    } else pendingMarkerRef.current = new maps.Marker({ map, position, image: makeFoodMarkerImage(maps, '한식', 22), title: '등록 위치' });
    openPanel('registration');
  }

  function searchNearbyPlaces() {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    const services = maps?.services;
    if (!maps || !map) return;
    const searchId = ++placeSearchId.current;
    placeSearchMarkersRef.current.forEach(({ marker }) => marker.setMap(null));
    placeSearchMarkersRef.current = [];
    setPlacesError('');
    if (!services) {
      setPlacesError('가게 검색을 불러오지 못했어요.');
      return;
    }
    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    lastSearchedBounds.current = {
      south: southWest.getLat(), west: southWest.getLng(),
      north: northEast.getLat(), east: northEast.getLng(),
    };
    setCanSearchPlaces(false);
    setPlacesLoading(true);
    new services.Places(map).categorySearch('FD6', (results, status, pagination) => {
      if (searchId !== placeSearchId.current) return;
      if (status === services.Status.OK) {
        const markers = results.flatMap((place) => {
          const latitude = Number(place.y);
          const longitude = Number(place.x);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
          const category = getFoodCategory(place.category_name, place.category_group_code);
          const image = makeFoodMarkerImage(maps, category, 20);
          const marker = new maps.Marker({ map, position: new maps.LatLng(latitude, longitude), title: place.place_name, image });
          maps.event.addListener(marker, 'click', () => {
            setSelectedRestaurant(null);
            selectPlace(place, marker);
          });
          return [{ id: place.id, marker }];
        });
        placeSearchMarkersRef.current.push(...markers);
        if (pagination.hasNextPage) {
          pagination.nextPage();
          return;
        }
        setPlacesLoading(false);
        if (!placeSearchMarkersRef.current.length) setPlacesError('주변에 검색된 가게가 없어요.');
      } else if (status === services.Status.ZERO_RESULT) {
        setPlacesLoading(false);
        if (!placeSearchMarkersRef.current.length) setPlacesError('주변에 검색된 가게가 없어요.');
      } else {
        setPlacesLoading(false);
        setCanSearchPlaces(true);
        setPlacesError('주변 가게를 검색하지 못했어요.');
      }
    }, {
      useMapBounds: true,
      size: 15,
    });
  }

  function closeAllPanels() {
    const selectedPlaceMarker = selectedPlaceMarkerRef.current;
    const maps = window.kakao?.maps;
    if (placeSelectionTimer.current !== null) window.clearTimeout(placeSelectionTimer.current);
    placeSelectionTimer.current = null;
    if (selectedPlaceMarker && maps) selectedPlaceMarker.marker.setImage(makeFoodMarkerImage(maps, selectedPlaceMarker.originalCategory, 20));
    selectedPlaceMarkerRef.current = null;
    setPanelStack([]);
    setSelectedRestaurant(null);
    setVisitReason('');
    setError('');
    pendingMarkerRef.current?.setMap(null);
    pendingMarkerRef.current = null;
  }

  function selectPlace(place: KakaoPlace, marker: KakaoMarker) {
    const maps = window.kakao?.maps;
    const latitude = Number(place.y);
    const longitude = Number(place.x);
    if (!maps || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    setName(place.place_name);
    const category = getFoodCategory(place.category_name, place.category_group_code);
    setCategory(category);
    setNote('');
    setLat(latitude);
    setLng(longitude);
    setPlaceInfo({
      placeId: place.id,
      address: place.road_address_name || place.address_name,
      phone: place.phone,
      placeUrl: place.place_url,
      kakaoPlace: place,
    });
    setError('');
    if (placeSelectionTimer.current !== null) window.clearTimeout(placeSelectionTimer.current);
    const previousSelection = selectedPlaceMarkerRef.current;
    if (previousSelection && previousSelection.marker !== marker) {
      previousSelection.marker.setImage(makeFoodMarkerImage(maps, previousSelection.originalCategory, 20));
    }
    marker.setImage(makeFoodMarkerImage(maps, category, 18));
    selectedPlaceMarkerRef.current = { marker, originalCategory: category };
    placeSelectionTimer.current = window.setTimeout(() => {
      marker.setImage(makeFoodMarkerImage(maps, category, 22));
      openPanel('registration');
      placeSelectionTimer.current = null;
    }, 90);
  }

  function chooseCategory(item: string) {
    setCategory(item);
    const maps = window.kakao?.maps;
    const marker = selectedPlaceMarkerRef.current?.marker ?? pendingMarkerRef.current;
    if (maps && marker) marker.setImage(makeFoodMarkerImage(maps, item, 22));
  }

  function openKakaoMap(restaurant: Restaurant) {
    const placeId = restaurant.placeId;
    const coordinates = `${restaurant.latitude},${restaurant.longitude}`;
    const appUrl = placeId ? `kakaomap://place?id=${placeId}` : `kakaomap://look?p=${coordinates}`;
    const mobileUrl = placeId ? `https://m.map.kakao.com/scheme/place?id=${placeId}` : `https://m.map.kakao.com/scheme/look?p=${coordinates}`;
    const webUrl = restaurant.placeUrl || `https://map.kakao.com/link/map/${encodeURIComponent(restaurant.name)},${coordinates}`;
    if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.href = appUrl;
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.href = mobileUrl;
    }, 900);
  }

  function startLongPress(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if ((event.target as HTMLElement).closest('button, a, [role="button"]')) return;
    cancelLongPress();
    const point = { id: event.pointerId, x: event.clientX, y: event.clientY };
    activePointer.current = point;
    longPressTimer.current = window.setTimeout(() => {
      const map = mapRef.current;
      const node = mapNodeRef.current;
      const maps = window.kakao?.maps;
      if (!map || !node || !maps || activePointer.current?.id !== point.id) return;
      const bounds = node.getBoundingClientRect();
      const location = map.getProjection().coordsFromContainerPoint(
        new maps.Point(point.x - bounds.left, point.y - bounds.top),
      );
      openRegistration(location.getLat(), location.getLng());
      longPressTimer.current = null;
    }, longPressMs);
  }

  function moveLongPress(event: PointerEvent<HTMLDivElement>) {
    const point = activePointer.current;
    if (point?.id === event.pointerId && Math.hypot(event.clientX - point.x, event.clientY - point.y) > 12) cancelLongPress();
  }

  function add(): boolean {
    if (!name.trim()) { setError('식당 이름을 입력해 줘.'); return false; }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setError('좌표를 확인해 줘.');
      return false;
    }
    const item: Restaurant = {
      id: crypto.randomUUID(), name: name.trim(), category, note: note.trim(),
      latitude: lat, longitude: lng, visited: false, createdAt: new Date().toISOString(),
      ...placeInfo,
    };
    const next = [item, ...items];
    setItems(next);
    saveRestaurants(next);
    if (placeInfo.placeId) {
      const selectedMarker = placeSearchMarkersRef.current.find(({ id }) => id === placeInfo.placeId);
      selectedMarker?.marker.setMap(null);
      placeSearchMarkersRef.current = placeSearchMarkersRef.current.filter(({ id }) => id !== placeInfo.placeId);
      selectedPlaceMarkerRef.current = null;
    }
    pendingMarkerRef.current?.setMap(null);
    pendingMarkerRef.current = null;
    setName('');
    setNote('');
    setError('');
    closeAllPanels();
    return true;
  }

  function recordVisit(restaurant: Restaurant, rating: 'satisfied' | 'unsatisfied') {
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
    const next = items.map((item) => item.id === restaurant.id
      ? { ...item, visited: true, visitDates: [...(item.visitDates ?? []), today], visitFeedback: [...(item.visitFeedback ?? []), { date: today, rating, reason: visitReason.trim() }] }
      : item);
    setItems(next);
    saveRestaurants(next);
    closeAllPanels();
  }

  const monthlyVisits = getMonthlyVisits(selectedRestaurant?.visitDates);
  const roadAddress = selectedRestaurant?.kakaoPlace?.road_address_name || '';
  const parcelAddress = selectedRestaurant?.kakaoPlace?.address_name || '';
  const currentAddress = showParcelAddress ? parcelAddress : roadAddress || parcelAddress || selectedRestaurant?.address || '';
  const addressLabel = showParcelAddress
    ? '지번 주소'
    : roadAddress
      ? '도로명 주소'
      : parcelAddress
        ? '지번 주소'
        : '주소';
  const maxMonthlyVisits = Math.max(1, ...monthlyVisits.map((month) => month.count));
  const visitCoordinates = monthlyVisits.map(({ count }, index) => ({ x: 15 + index * 30, y: 76 - count / maxMonthlyVisits * 56 }));
  const visitPoints = visitCoordinates.map(({ x, y }) => `${x},${y}`).join(' ');
  const visitAreaPath = `M 15 76 L ${visitPoints} L 345 76 Z`;

  return <main className="fixed inset-0 z-0 overflow-hidden bg-slate-100 font-sans">
    {key && <Script
      src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`}
      strategy="afterInteractive"
      onReady={() => setReady(true)}
      onError={() => setMapError(`카카오 지도를 불러오지 못했어요. 키와 등록 도메인을 확인해 주세요. (현재: ${typeof window !== 'undefined' ? window.location.origin : ''})`)}
    />}
    <div
      id="restaurant-map"
      ref={mapNodeRef}
      className="absolute inset-0 bg-slate-100"
      role="region"
      aria-label="맛집 지도"
      aria-busy={!!key && (!ready || !itemsLoaded)}
      onPointerDownCapture={startLongPress}
      onPointerMoveCapture={moveLongPress}
      onPointerUpCapture={cancelLongPress}
      onPointerCancelCapture={cancelLongPress}
      onContextMenu={(event) => event.preventDefault()}
    />
    <div className="pointer-events-none absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-10">
      {placesError && <p role="alert" className="pointer-events-auto mt-2 rounded-md bg-white/95 px-3 py-2 text-sm text-slate-600">{placesError}</p>}
      {locationError && <div className="pointer-events-auto mt-2 flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-600"><span>{locationError}</span><Button type="button" variant="ghost" size="sm" onClick={locate} className="shrink-0 !h-auto !min-h-0 !px-1 !py-0 font-semibold text-slate-950">다시 시도</Button></div>}
      {mapError && <p role="alert" className="pointer-events-auto mt-2 rounded-md bg-white px-3 py-2 text-sm text-red-700">{mapError}</p>}
      {!key && <p className="pointer-events-auto mt-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700">지도 키 설정이 필요해요.</p>}
      {mapRange && <p className="pointer-events-auto mt-2 w-fit rounded-md bg-[#f7f5ef]/95 px-3 py-2 text-xs text-[#4d5b3c] shadow">현재 지도 범위 {mapRange.widthKm.toFixed(1)} × {mapRange.heightKm.toFixed(1)}km</p>}
    </div>
    <Button type="button" variant="outline" disabled={!mapCreated || placesLoading || !canSearchPlaces} className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom)+7rem)] right-4 z-20 size-12 min-h-12 !rounded-full !border border-[#d9d8b8] !bg-[#f7f5ef] !p-0 text-xl shadow-lg shadow-[#38432f]/20 hover:!bg-[#efe6d4]" aria-label="이 지역 가게 조회하기" title={placesLoading ? '가게 조회 중' : '이 지역 가게 조회하기'} onClick={searchNearbyPlaces}><span aria-hidden="true">🐷</span></Button>
    <Button type="button" variant="outline" className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom)+3.5rem)] right-4 z-20 size-12 min-h-12 !rounded-full !border border-[#d9d8b8] !bg-[#f7f5ef] !p-0 text-[#4d5b3c] shadow-lg shadow-[#38432f]/20 hover:!bg-[#efe6d4]" aria-label="저장한 맛집 목록 보기" title="저장한 맛집 목록 보기" onClick={() => openPanel('list')}><List size={20} aria-hidden="true"/></Button>
    <Button type="button" variant="outline" className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-20 size-12 min-h-12 !rounded-full !border border-[#d9d8b8] !bg-[#f7f5ef] !p-0 text-[#4d5b3c] shadow-lg shadow-[#38432f]/20 hover:!bg-[#efe6d4]" aria-label="내 위치로 이동" onClick={() => {
      locate();
      if (location) {
        const maps = window.kakao?.maps;
        if (maps && mapRef.current) mapRef.current.setCenter(new maps.LatLng(location.latitude, location.longitude));
      }
    }}><LocateFixed size={20} strokeWidth={2.2} aria-hidden="true"/></Button>

    <DepthDrawer open={panelDepth > 0} depth={panelDepth} onClose={closeAllPanels}>
      {activePanel && <>
        <DrawerHeader className={`flex-row shrink-0 items-center justify-between gap-3 border-b border-[#e6e1d1] px-4 py-3 ${activePanel === 'detail' ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)]' : 'pt-[calc(env(safe-area-inset-top)+0.75rem)]'} text-left`}>
          {activePanel === 'registration' && placeInfo.kakaoPlace ? <DrawerTitle className="flex min-w-0 flex-1 items-center gap-2 text-base font-bold leading-tight text-[#3f4b32]">
            <Image src={getFoodIcon(category)} width={26} height={26} alt="" aria-hidden="true" className="shrink-0"/>
            <span className="min-w-0 truncate">{name}</span>
            <span className="shrink-0 text-xs font-normal text-[#777765]">({placeInfo.kakaoPlace.id})</span>
          </DrawerTitle> : activePanel === 'detail' && selectedRestaurant ? <DrawerTitle className="flex min-w-0 flex-1 items-center gap-2 text-base font-bold leading-tight text-[#3f4b32]">
            <span className="min-w-0 truncate">{selectedRestaurant.name}</span>
            {selectedRestaurant.placeId && <span className="shrink-0 text-xs font-normal text-[#777765]">({selectedRestaurant.placeId})</span>}
          </DrawerTitle> : <DrawerTitle className="text-lg font-bold leading-tight text-[#3f4b32]">{activePanel === 'list' ? '저장한 맛집' : activePanel === 'registration' ? '맛집 등록' : '방문 평가'}</DrawerTitle>}
          <Button type="button" variant="ghost" className="size-9 min-h-9 shrink-0 rounded-full !p-0" aria-label="전체 닫기" title="전체 닫기" onClick={closeAllPanels}><X size={17} aria-hidden="true"/></Button>
        </DrawerHeader>
        <div className="map-scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {activePanel === 'list' && (items.length ? <ul className="space-y-2 pt-3">
            {items.map((item) => {
              const feedback = item.visitFeedback ?? [];
              const score = feedback.length ? Math.round(feedback.filter(({ rating }) => rating === 'satisfied').length / feedback.length * 100) : null;
              const latestFeedback = feedback.at(-1);
              return <li key={item.id}>
                  <Button type="button" variant="ghost" onClick={() => { setSelectedRestaurant(item); setShowParcelAddress(false); pushPanel('detail'); }} className="!h-auto !min-h-0 !w-full !justify-start !rounded-xl !border !border-[#e6e1d1] !bg-white !px-3 !py-3 text-left !whitespace-normal hover:!bg-[#efe6d4]">
                  <Image src={getFoodIcon(item.category)} width={30} height={30} alt="" aria-hidden="true" className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#3f4b32]">{item.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#777765]">{item.category}{item.address ? ` · ${item.address}` : ''}</span>
                    <span className="mt-1 block truncate text-xs text-[#777765]">{score === null ? `방문 ${item.visitDates?.length ?? 0}회` : `만족률 ${score}% · 평가 ${feedback.length}회`}{latestFeedback ? ` · ${latestFeedback.reason}` : ''}</span>
                  </span>
                </Button>
              </li>;
            })}
          </ul> : <p className="px-1 py-8 text-center text-sm text-[#777765]">저장한 맛집이 없어요.</p>)}

          {activePanel === 'detail' && selectedRestaurant && <div className="flex min-h-full flex-col">
            <div className="space-y-4 pt-4">
            <Zoom initialScale={0.8} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              <div className="flex flex-col items-center gap-1">
                <Image src={getFoodIcon(selectedRestaurant.category)} width={48} height={48} alt="" aria-hidden="true" />
                <p className="font-medium text-[#4d5b3c]">{selectedRestaurant.category}</p>
              </div>
            </Zoom>
            <section className="overflow-hidden rounded-xl border border-[#e6e1d1] text-sm text-slate-600">
              <dl className="divide-y divide-[#eeeade] border-t border-[#eeeade] text-xs leading-5">
                <div className="flex items-start justify-between gap-2 p-3">
                  <dt className="sr-only">{addressLabel}</dt>
                  <dd className="flex min-w-0 flex-1 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[#777765]">{addressLabel}</p>
                    {roadAddress && parcelAddress
                      ? <Button type="button" variant="ghost" aria-pressed={showParcelAddress} aria-label={`${showParcelAddress ? '지번' : '도로명'} 주소 표시 중. ${showParcelAddress ? '도로명' : '지번'} 주소로 전환`} onClick={() => setShowParcelAddress((current) => !current)} className="!h-auto !min-h-0 !w-full !justify-start !rounded-none !px-0 !py-0 text-left !whitespace-normal text-sm font-normal text-[#3f4b32] hover:!bg-transparent hover:!text-[#3f4b32]">{currentAddress || '정보 없음'}</Button>
                      : <p className="break-words text-sm text-[#3f4b32]">{currentAddress || '정보 없음'}</p>}
                    </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="outline" size="sm" disabled={!currentAddress} onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(currentAddress);
                        toast.add({ title: '주소를 복사했어요.' });
                      } catch {
                        toast.add({ title: '주소를 복사하지 못했어요.' });
                      }
                      }} aria-label="주소 복사" className="!size-10 !min-h-10 !border-0" title="주소 복사">
                        <span aria-hidden="true" className="text-lg">📋</span>
                      </Button>
                    {selectedRestaurant.phone && <Button asChild variant="ghost" size="icon" className="!size-10 !min-h-10 text-[#4d5b3c]">
                      <a href={`tel:${selectedRestaurant.phone}`} aria-label="전화 걸기">
                        <span aria-hidden="true" className="text-lg">📞</span>
                      </a>
                    </Button>}
                    <Button type="button" variant="ghost" size="icon" aria-label="카카오맵 상세 정보" title="카카오맵 상세 정보" className="!size-10 !min-h-10 text-[#4d5b3c]" onClick={() => openKakaoMap(selectedRestaurant)}><span aria-hidden="true" className="text-lg">📍</span></Button>
                  </div>
                  </dd>
                </div>
              </dl>
            </section>
            <section aria-label="최근 12개월 방문 횟수" className="space-y-2 rounded-xl border border-[#d9d8b8] bg-white p-4">
              <div className="flex items-baseline justify-between"><h2 className="text-sm font-medium text-[#4d5b3c]">방문 기록</h2><p className="text-sm text-slate-600">총 {selectedRestaurant.visitDates?.length ?? 0}회{selectedRestaurant.visitFeedback?.length ? ` · 만족률 ${Math.round(selectedRestaurant.visitFeedback.filter(({ rating }) => rating === 'satisfied').length / selectedRestaurant.visitFeedback.length * 100)}%` : ''}</p></div>
              <svg viewBox="0 0 360 112" className="h-28 w-full overflow-visible" role="img" aria-label={monthlyVisits.map(({ label, count }) => `${label} ${count}회`).join(', ')}>
                <defs><linearGradient id="visit-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#66734b" stopOpacity=".28"/><stop offset="100%" stopColor="#66734b" stopOpacity=".02"/></linearGradient></defs>
                <line x1="15" y1="76" x2="345" y2="76" stroke="#d9d8b8" strokeWidth="1"/>
                <path d={visitAreaPath} fill="url(#visit-chart-fill)" className="visit-chart-area"/>
                <polyline points={visitPoints} pathLength="1" fill="none" stroke="#66734b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="visit-chart-line"/>
                {monthlyVisits.map(({ label, count }, index) => <g key={label}>
                  <circle cx={visitCoordinates[index].x} cy={visitCoordinates[index].y} r="3.5" fill="#4d5b3c" className={`visit-chart-point${index === monthlyVisits.length - 1 ? ' visit-chart-point-current' : ''}`} style={{ animationDelay: `${index * 45}ms` }}/>
                  <text x={visitCoordinates[index].x} y={visitCoordinates[index].y - 9} textAnchor="middle" fontSize="9" fill="#4d5b3c">{count}</text>
                </g>)}
              </svg>
            </section>
            {!!selectedRestaurant.visitFeedback?.length && <section className="space-y-3 border-t border-[#e6e1d1] pt-4"><h2 className="text-sm font-medium text-[#4d5b3c]">방문 평가</h2><ul className="space-y-3">{[...selectedRestaurant.visitFeedback].reverse().map((feedback, index) => <li key={`${feedback.date}-${index}`} className="border-l-2 border-[#d9d8b8] pl-3"><p className="text-xs text-slate-500">{feedback.date} · {feedback.rating === 'satisfied' ? '🐷 만족' : '💀 불만족'}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{feedback.reason}</p></li>)}</ul></section>}
            {selectedRestaurant.note && <section className="border-t border-[#e6e1d1] pt-4"><h2 className="mb-2 text-sm font-medium text-[#4d5b3c]">메모</h2><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedRestaurant.note}</p></section>}
            </div>
            <div className="sticky bottom-0 mt-auto border-t border-[#e6e1d1] bg-[#f7f5ef]/95 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-4">
              <Button type="button" className="visit-trigger !h-14 !min-h-14 w-full !py-4 text-base !bg-[#66734b] hover:!bg-[#556340]" onClick={() => { setVisitReason(''); pushPanel('feedback'); }}>방문했음</Button>
            </div>
          </div>}

          {activePanel === 'registration' && <form className="flex min-h-full flex-col" onSubmit={(event) => { event.preventDefault(); add(); }}>
            <div className="space-y-4 pt-4">
              <fieldset className="space-y-1.5">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="group" aria-label="음식 종류 선택">
                  {categories.map((item) => <Button key={item} type="button" variant="outline" aria-pressed={category === item} onClick={() => chooseCategory(item)} className={`!h-auto !min-h-14 !w-full !flex-col !gap-1 !rounded-xl !px-1 !py-2 text-[11px] font-medium ${category === item ? '!border-[#4d5b3c] !bg-[#4d5b3c] !text-[#f7f5ef]' : '!border-[#d9d8b8] !bg-[#f7f5ef] !text-[#5d604d] hover:!bg-[#efe6d4]'}`}>
                    <Image src={getFoodIcon(item)} width={22} height={22} alt="" aria-hidden="true"/>
                    {item}
                  </Button>)}
                </div>
              </fieldset>
              {placeInfo.kakaoPlace ? <section className="overflow-hidden rounded-xl border border-[#e6e1d1] bg-white text-sm text-slate-600">
                <div className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#777765]">음식점 카테고리</p>
                    <p className="mt-1 font-medium text-[#4d5b3c]">{placeInfo.kakaoPlace.category_name ? getFoodSubcategory(placeInfo.kakaoPlace.category_name) : '정보 없음'}</p>
                    <p className="mt-0.5 text-xs text-[#777765]">{placeInfo.kakaoPlace.category_group_name || '그룹 정보 없음'} · {placeInfo.kakaoPlace.category_group_code || '코드 없음'}</p>
                  </div>
                  {placeInfo.kakaoPlace.place_url && <a href={placeInfo.kakaoPlace.place_url} target="_blank" rel="noreferrer" aria-label="카카오맵 상세 정보" title="카카오맵 상세 정보" className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#4d5b3c] transition-colors hover:bg-[#efe6d4]"><span aria-hidden="true" className="text-lg">📍</span></a>}
                </div>
                <dl className="divide-y divide-[#eeeade] border-t border-[#eeeade] text-xs leading-5">
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 p-3"><dt className="text-[#777765]">도로명 주소</dt><dd className="break-words">{placeInfo.kakaoPlace.road_address_name || '정보 없음'}</dd></div>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 p-3"><dt className="text-[#777765]">지번 주소</dt><dd className="break-words">{placeInfo.kakaoPlace.address_name || '정보 없음'}</dd></div>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 p-3"><dt className="text-[#777765]">전화번호</dt><dd>{placeInfo.kakaoPlace.phone ? <a href={`tel:${placeInfo.kakaoPlace.phone}`} className="underline">{placeInfo.kakaoPlace.phone}</a> : '정보 없음'}</dd></div>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 p-3"><dt className="text-[#777765]">검색 거리</dt><dd>{placeInfo.kakaoPlace.distance ? `${placeInfo.kakaoPlace.distance}m` : '정보 없음'}</dd></div>
                </dl>
              </section> : <Input aria-label="가게 이름" className="h-10" value={name} onChange={(event) => setName(event.target.value)} placeholder="가게 이름"/>}
              <textarea aria-label="메모" value={note} onChange={(event) => setNote(event.target.value)} placeholder="뭐든써봐" rows={5} className="w-full resize-y rounded-lg border border-[#d9d8b8] bg-white px-3 py-3 text-base text-[#3f4b32] outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#66734b]"/>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="sticky bottom-0 mt-auto bg-[#f7f5ef]/95 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-4">
              <Button type="submit" className="!h-14 !min-h-14 w-full !py-4 text-base !bg-[#66734b] hover:!bg-[#556340]"><Save size={18} aria-hidden="true"/>맛집 저장</Button>
            </div>
          </form>}

          {activePanel === 'feedback' && selectedRestaurant && <div className="mx-auto flex min-h-full w-full max-w-lg flex-col">
            <div className="space-y-4 pt-8">
              <div><h2 className="text-xl font-semibold text-[#3f4b32]">이번 방문은 어땠어?</h2><p className="mt-1 text-sm text-[#777765]">{selectedRestaurant.name} · 이유를 적고 만족도를 골라줘.</p></div>
              <textarea aria-label="방문 이유" value={visitReason} onChange={(event) => setVisitReason(event.target.value)} placeholder="좋았던 점이나 아쉬웠던 점" rows={4} className="w-full resize-y rounded-lg border border-[#d9d8b8] bg-white px-3 py-2 text-base text-[#3f4b32] outline-none focus-visible:ring-2 focus-visible:ring-[#66734b]"/>
            </div>
            <div className="sticky bottom-0 mt-auto grid grid-cols-2 gap-3 bg-[#f7f5ef]/95 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-4">
              <Button type="button" disabled={!visitReason.trim()} className="visit-rating-button !h-14 !min-h-14 !bg-[#66734b] !py-4 text-[#f7f5ef] hover:!bg-[#556340]" onClick={() => recordVisit(selectedRestaurant, 'satisfied')}><span aria-hidden="true">🐷</span> 만족</Button>
              <Button type="button" disabled={!visitReason.trim()} className="visit-rating-button !h-14 !min-h-14 !bg-[#66734b] !py-4 text-[#f7f5ef] hover:!bg-[#556340]" onClick={() => recordVisit(selectedRestaurant, 'unsatisfied')}><span aria-hidden="true">💀</span> 불만족</Button>
            </div>
          </div>}
        </div>
      </>}
    </DepthDrawer>
  </main>;
}
