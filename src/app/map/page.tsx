'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { DepthDrawer } from '@/components/ui/depth-drawer';
import { loadRestaurants, saveRestaurants } from '@/lib/restaurants';
import type { Restaurant } from '@/lib/types';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { getFoodCategory, getFoodIcon } from '@/lib/food-categories';
import { List, LocateFixed, X } from 'lucide-react';
import { MapNotebook, panelTitles, type MapPanel } from './map-notebook';
import { findRestaurants, getRestaurantMarker, type MapRestaurant, type MapVisit, type RestaurantFilter } from './restaurant-memory';
import { deleteMapVisit, importLocalMap, isMapMemberRequired, loadSharedMap, saveMapRecord, type MapImportResult, type MapRecordSaveOptions } from '@/lib/map-db';
import { resolveSavedMapRestaurant } from '@/lib/map-import';
import { useAuth } from '@/components/auth/auth-provider';
import './map.css';

type KakaoLatLng = { getLat: () => number; getLng: () => number };
type KakaoBounds = { getSouthWest: () => KakaoLatLng; getNorthEast: () => KakaoLatLng };
type KakaoMarker = { setMap: (map: KakaoMap | null) => void; setPosition: (position: unknown) => void; setImage: (image: unknown) => void };
type KakaoCustomOverlay = { setMap: (map: KakaoMap | null) => void };
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
        CustomOverlay: new (options: object) => KakaoCustomOverlay;
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
const longPressMs = 550;
const markerSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="44" viewBox="0 0 38 44"><path d="M19 2C9.6 2 2 9.6 2 19c0 11.5 17 23 17 23s17-11.5 17-23C36 9.6 28.4 2 19 2Z" fill="#38432f" opacity=".3"/><path d="M19 1C9.6 1 2 8.6 2 18c0 11.5 17 23 17 23s17-11.5 17-23C36 8.6 28.4 1 19 1Z" fill="#66734b" stroke="#f7f5ef" stroke-width="2.5"/><circle cx="19" cy="18" r="8" fill="#efe6d4" stroke="#f7f5ef" stroke-width="2"/><circle cx="19" cy="18" r="3" fill="#4d5b3c"/></svg>';
const locationMarkerSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36"><g transform="translate(0 4)"><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0;0 -2;0 0" keyTimes="0;.22;.5;.72;1" dur="1800ms" repeatCount="indefinite"/><path d="M12 1C6.5 1 2 5.5 2 11c0 7 10 18 10 18s10-11 10-18C22 5.5 17.5 1 12 1Z" fill="#66734b" stroke="#fff" stroke-width="2"/><circle cx="12" cy="11" r="4.5" fill="#efe6d4"/><circle cx="12" cy="11" r="1.8" fill="#4d5b3c"/></g></g></svg>';
const savedMarkerSvgs = {
  heart: '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42"><path d="M17 40S2 27 2 17a15 15 0 0 1 30 0c0 10-15 23-15 23Z" fill="#B4534B" stroke="#fff" stroke-width="2.5"/><path d="M17 25 9.5 18a5 5 0 0 1 7.5-6 5 5 0 0 1 7.5 6Z" fill="#fff4ef"/></svg>',
  memo: '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42"><path d="M17 40S2 27 2 17a15 15 0 0 1 30 0c0 10-15 23-15 23Z" fill="#A47536" stroke="#fff" stroke-width="2.5"/><rect x="10" y="9" width="14" height="17" rx="2" fill="#fff8e9"/><path d="M13 14h8m-8 4h8m-8 4h5" stroke="#A47536" stroke-width="1.5" stroke-linecap="round"/></svg>',
  visited: '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42"><path d="M17 40S2 27 2 17a15 15 0 0 1 30 0c0 10-15 23-15 23Z" fill="#368564" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="17" r="9" fill="#e5f5eb"/><path d="m12.5 17 3 3 6-6" fill="none" stroke="#287050" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const savedMarkerUrl = (kind: keyof typeof savedMarkerSvgs) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(savedMarkerSvgs[kind])}`;

function makeSavedMarkerImage(maps: NonNullable<Window['kakao']>['maps'], kind: keyof typeof savedMarkerSvgs) {
  return new maps.MarkerImage(savedMarkerUrl(kind), new maps.Size(30.6, 37.8), {
    offset: new maps.Point(15.3, 36), alt: kind === 'heart' ? '하트 저장' : kind === 'visited' ? '다녀온 곳' : '가게 기억',
  });
}

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

export default function MapPage() {
  const pathname = usePathname();
  const [items, setItems] = useState<MapRestaurant[]>([]);
  const [localItems, setLocalItems] = useState<MapRestaurant[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [sharedUserId, setSharedUserId] = useState<string | null>(null);
  const [sharedErrorState, setSharedErrorState] = useState<{ userId: string; message: string } | null>(null);
  const [memberRequiredUserId, setMemberRequiredUserId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [localItemCount, setLocalItemCount] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RestaurantFilter>('all');
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapCreated, setMapCreated] = useState(false);
  const { location, error: locationError, locate } = useCurrentLocation();
  const { user, profileReady, loading: authLoading, available: authAvailable } = useAuth();
  const sharedMode = Boolean(user && authAvailable && sharedUserId === user.id);
  const sharedError = sharedErrorState && sharedErrorState.userId === user?.id ? sharedErrorState.message : '';
  const memberRequired = memberRequiredUserId === user?.id && !!user;
  const displayItems = sharedMode ? items : localItems;
  const localItemsRef = useRef<MapRestaurant[]>([]);
  const [panelStack, setPanelStack] = useState<MapPanel[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<MapRestaurant | null>(null);
  const displayRestaurant = selectedRestaurant ? displayItems.find(item => item.id === selectedRestaurant.id) ?? null : null;
  const [visitToEdit, setVisitToEdit] = useState<MapVisit | null>(null);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [canSearchPlaces, setCanSearchPlaces] = useState(true);
  const [mapRange, setMapRange] = useState<{ widthKm: number; heightKm: number } | null>(null);
  const [placesError, setPlacesError] = useState('');
  const [placeInfo, setPlaceInfo] = useState<Pick<Restaurant, 'placeId' | 'address' | 'phone' | 'placeUrl' | 'kakaoPlace'>>({});
  const [name, setName] = useState('');
  const [category, setCategory] = useState('기타');
  const [lat, setLat] = useState(37.5495);
  const [lng, setLng] = useState(126.914);
  const mapNodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerImageRef = useRef<unknown>(null);
  const locationMarkerRef = useRef<KakaoMarker | null>(null);
  const pendingMarkerRef = useRef<KakaoMarker | null>(null);
  const restaurantMarkersRef = useRef<KakaoMarker[]>([]);
  const placeSearchMarkersRef = useRef<{ id: string; marker: KakaoMarker; label: KakaoCustomOverlay }[]>([]);
  const selectedPlaceMarkerRef = useRef<{ marker: KakaoMarker; originalCategory: string } | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const placeSelectionTimer = useRef<number | null>(null);
  const activePointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const placeSearchId = useRef(0);
  const lastSearchedBounds = useRef<{ south: number; west: number; north: number; east: number } | null>(null);
  const activePanel = panelStack.at(-1);
  const panelDepth = panelStack.length;

  function openPanel(panel: MapPanel) { setPanelStack([panel]); }
  function pushPanel(panel: MapPanel) { setPanelStack((stack) => [...stack, panel]); }


  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const localItems = loadRestaurants() as MapRestaurant[];
      localItemsRef.current = localItems;
      setLocalItems(localItems);
      setLocalItemCount(localItems.length);
      setItems(localItems);
      setItemsLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!itemsLoaded || !profileReady || authLoading) return;
    let active = true;
    if (!user || !authAvailable) {
      const frame = requestAnimationFrame(() => setItems(localItemsRef.current));
      return () => { active = false; cancelAnimationFrame(frame); };
    }
    void loadSharedMap().then(sharedItems => {
      if (!active) return;
      setItems(sharedItems);
      setSharedUserId(user.id);
      setMemberRequiredUserId(null);
      setSharedErrorState(null);
    }).catch(error => {
      if (!active) return;
      setItems(localItemsRef.current);
      setSharedUserId(null);
      if (isMapMemberRequired(error)) {
        setMemberRequiredUserId(user.id);
        setSharedErrorState(null);
      } else {
        setMemberRequiredUserId(null);
        setSharedErrorState({ userId: user.id, message: '공유 기록을 불러오지 못했어요. 현재 기기에 저장된 기록을 보여드려요.' });
      }
    });
    return () => { active = false; };
  }, [itemsLoaded, profileReady, authLoading, user, authAvailable]);

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
    const center = location ?? (displayItems[0] && { latitude: displayItems[0].latitude, longitude: displayItems[0].longitude });
    if (center) map.setCenter(new maps.LatLng(center.latitude, center.longitude));
  }, [displayItems, mapCreated, location]);

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
    function addRestaurantMarker(maps: NonNullable<Window['kakao']>['maps'], map: KakaoMap, item: MapRestaurant): KakaoMarker[] {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude) || Math.abs(item.latitude) > 90 || Math.abs(item.longitude) > 180) return [];
      const position = new maps.LatLng(item.latitude, item.longitude);
      const kind = getRestaurantMarker(item);
      if (!kind) return [];
      const image = makeSavedMarkerImage(maps, kind);
      const showRestaurant = () => {
        setSelectedRestaurant(item);

        setPanelStack(['restaurant']);
      };
      const marker = new maps.Marker({ map, position, title: `${item.name} · ${kind === 'heart' ? '하트 저장' : kind === 'visited' ? '다녀온 곳' : '가게 기억'}`, image, zIndex: 2 });
      maps.event.addListener(marker, 'click', showRestaurant);
      return [marker];
    }

    const restaurants = findRestaurants(displayItems, query, filter);
    restaurantMarkersRef.current = restaurants.flatMap((restaurant) => addRestaurantMarker(maps, map, restaurant));
    return () => {
      restaurantMarkersRef.current.forEach((marker) => marker.setMap(null));
      restaurantMarkersRef.current = [];
    };
  }, [displayItems, query, filter, mapCreated]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => mapRef.current?.relayout());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => () => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
    if (placeSelectionTimer.current !== null) window.clearTimeout(placeSelectionTimer.current);
    placeSearchId.current += 1;
    placeSearchMarkersRef.current.forEach(({ marker, label }) => {
      marker.setMap(null);
      label.setMap(null);
    });
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
    setCategory('기타');

    setPlaceInfo({});

    setPlacesError('');
    setSelectedRestaurant(null);

    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.setPosition(position);
      pendingMarkerRef.current.setImage(makeFoodMarkerImage(maps, '기타', 22));
    } else pendingMarkerRef.current = new maps.Marker({ map, position, image: makeFoodMarkerImage(maps, '기타', 22), title: '등록 위치' });
    openPanel('restaurant');
  }

  function searchNearbyPlaces() {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    const services = maps?.services;
    if (!maps || !map) return;
    const searchId = ++placeSearchId.current;
    placeSearchMarkersRef.current.forEach(({ marker, label }) => {
      marker.setMap(null);
      label.setMap(null);
    });
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
          if (findRestaurants(displayItems, '', 'all').some(item => item.placeId === place.id)) return [];
          const latitude = Number(place.y);
          const longitude = Number(place.x);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
          const category = getFoodCategory(place.category_name, place.category_group_code);
          const position = new maps.LatLng(latitude, longitude);
          const image = makeFoodMarkerImage(maps, category, 22);
          const marker = new maps.Marker({ map, position, title: place.place_name, image });
          const labelNode = document.createElement('button');
          labelNode.type = 'button';
          labelNode.textContent = place.place_name;
          labelNode.setAttribute('aria-label', `${place.place_name} 상세 보기`);
          labelNode.className = 'inline-block max-w-32 -translate-y-1 cursor-pointer truncate whitespace-nowrap rounded-md border border-[#d9d8b8] bg-[#f7f5ef] px-1.5 py-0.5 text-xs font-semibold text-[#38432f] shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4d5b3c]';
          const label = new maps.CustomOverlay({ map, position, content: labelNode, clickable: true, xAnchor: 0.5, yAnchor: 1.2, zIndex: 1 });
          const showPlace = () => {
            setSelectedRestaurant(null);
            selectPlace(place, marker);
          };
          maps.event.addListener(marker, 'click', showPlace);
          labelNode.addEventListener('click', showPlace);
          return [{ id: place.id, marker, label }];
        });
        placeSearchMarkersRef.current.push(...markers);
        if (pagination.hasNextPage) {
          pagination.nextPage();
          return;
        }
        setPlacesLoading(false);
        if (!placeSearchMarkersRef.current.length) setPlacesError('새로 조회된 가게가 없어요. 저장한 가게는 내 목록에서 확인해요.');
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
    if (selectedPlaceMarker && maps) selectedPlaceMarker.marker.setImage(makeFoodMarkerImage(maps, selectedPlaceMarker.originalCategory, 22));
    selectedPlaceMarkerRef.current = null;
    setPanelStack([]);
    setSelectedRestaurant(null);

    pendingMarkerRef.current?.setMap(null);
    pendingMarkerRef.current = null;
  }

  function selectPlace(place: KakaoPlace, marker: KakaoMarker) {
    const maps = window.kakao?.maps;
    const latitude = Number(place.y);
    const longitude = Number(place.x);
    if (!maps || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const savedRestaurant = items.find((item) => item.placeId === place.id);
    if (savedRestaurant) {
      setSelectedRestaurant(savedRestaurant);

      openPanel('restaurant');
      return;
    }
    setSelectedRestaurant(null);
    setName(place.place_name);
    const category = getFoodCategory(place.category_name, place.category_group_code);
    setCategory(category);

    setLat(latitude);
    setLng(longitude);
    setPlaceInfo({
      placeId: place.id,
      address: place.road_address_name || place.address_name,
      phone: place.phone,
      placeUrl: place.place_url,
      kakaoPlace: place,
    });

    if (placeSelectionTimer.current !== null) window.clearTimeout(placeSelectionTimer.current);
    const previousSelection = selectedPlaceMarkerRef.current;
    if (previousSelection && previousSelection.marker !== marker) {
      previousSelection.marker.setImage(makeFoodMarkerImage(maps, previousSelection.originalCategory, 22));
    }
    marker.setImage(makeFoodMarkerImage(maps, category, 18));
    selectedPlaceMarkerRef.current = { marker, originalCategory: category };
    placeSelectionTimer.current = window.setTimeout(() => {
      marker.setImage(makeFoodMarkerImage(maps, category, 22));

      openPanel('restaurant');
      placeSelectionTimer.current = null;
    }, 90);
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

  async function saveRestaurant(item: MapRestaurant, options?: MapRecordSaveOptions): Promise<boolean> {
    if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude) || Math.abs(item.latitude) > 90 || Math.abs(item.longitude) > 180) return false;
    if (user && authAvailable && !sharedMode && !memberRequired) {
      setSharedErrorState({ userId: user.id, message: '공유 연결을 확인할 수 없어 저장을 멈췄어요. 다시 불러온 뒤 저장해 주세요.' });
      return false;
    }
    let savedItem = item;
    if (sharedMode) {
      try {
        const saved = await saveMapRecord(item, options);
        const refreshed = await loadSharedMap();
        setItems(refreshed);
        savedItem = resolveSavedMapRestaurant(saved, refreshed);
        setSharedErrorState(null);
      } catch {
        if (user) setSharedErrorState({ userId: user.id, message: '공유 기록을 저장하지 못했어요. 입력은 유지돼요.' });
        return false;
      }
    } else {
    const exists = localItems.some(saved => saved.id === item.id);
    const next = exists ? localItems.map(saved => saved.id === item.id ? item : saved) : [item, ...localItems];
    try {
      saveRestaurants(next);
    } catch {
      return false;
    }
    setItems(next);
    localItemsRef.current = next;
    setLocalItems(next);
    setLocalItemCount(next.length);
    }
    void window.MumukgNative?.triggerHaptic('success').catch(() => undefined);
    const exists = items.some(saved => saved.id === item.id);
    if (!exists && item.placeId) {
      const result = placeSearchMarkersRef.current.find(({ id }) => id === item.placeId);
      result?.marker.setMap(null);
      result?.label.setMap(null);
      placeSearchMarkersRef.current = placeSearchMarkersRef.current.filter(({ id }) => id !== item.placeId);
      selectedPlaceMarkerRef.current = null;
    }
    pendingMarkerRef.current?.setMap(null);
    pendingMarkerRef.current = null;
    setSelectedRestaurant(savedItem);
    openPanel('restaurant');
    return true;
  }

  async function removeSharedVisit(visitId: string) {
    if (!sharedMode) return false;
    try {
      await deleteMapVisit(visitId);
      const refreshed = await loadSharedMap();
      setItems(refreshed);
      const updated = refreshed.find(value => value.id === selectedRestaurant?.id);
      if (updated) setSelectedRestaurant(updated);
      return true;
    } catch {
      if (user) setSharedErrorState({ userId: user.id, message: '방문 기록을 삭제하지 못했어요. 연결과 권한을 확인해 주세요.' });
      return false;
    }
  }

  async function importLocalRecords() {
    if (!sharedMode || importing || !localItemsRef.current.length) return;
    setImporting(true);
    setImportStatus('');
    try {
      const result: MapImportResult = await importLocalMap(localItemsRef.current);
      const refreshed = await loadSharedMap();
      setItems(refreshed);
      setImportStatus(`가게 ${result.imported}곳 가져옴 · 방문 ${result.visitsImported}건 추가${result.conflicts ? ` · 기존 기록과 다른 메모 ${result.conflicts}건은 원격 기록을 유지했어요` : ''}`);
    } catch {
      setImportStatus('가져오기에 실패했어요. 원본 기록은 이 기기에 그대로 있어요. 다시 시도해 주세요.');
    } finally {
      setImporting(false);
    }
  }

  const draft: MapRestaurant = {
    id: '', name, category, latitude: lat, longitude: lng, note: '', visited: false, isFavorite: false, createdAt: '', ...placeInfo,
  };

  return <main className="map-theme fixed inset-0 z-0 overflow-hidden bg-slate-100 font-sans">
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
      {sharedError && <p role="alert" className="pointer-events-auto mt-2 rounded-md bg-white px-3 py-2 text-sm text-red-700">{sharedError}</p>}
      {memberRequired && <p className="pointer-events-auto mt-2 rounded-md bg-white px-3 py-2 text-sm text-slate-600">멤버 승인 전이라 기록은 이 기기에만 저장돼요.</p>}
      {!key && <p className="pointer-events-auto mt-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700">지도 키 설정이 필요해요.</p>}
      {mapRange && <p className="pointer-events-auto mt-2 w-fit rounded-md bg-[#f7f5ef]/95 px-3 py-2 text-xs text-[#4d5b3c] shadow">현재 지도 범위 {mapRange.widthKm.toFixed(1)} × {mapRange.heightKm.toFixed(1)}km</p>}
    </div>
    <div className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 z-10 max-w-[calc(100%-6rem)] rounded-xl bg-[var(--map-paper)] px-3 py-2 text-xs text-[var(--map-ink)] shadow-sm">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">{([{ kind: 'heart', label: '하트 저장' }, { kind: 'visited', label: '다녀온 곳' }, { kind: 'memo', label: '가게 기억' }] as const).map(({ kind, label }) => <span key={label} className="inline-flex items-center gap-1"><span aria-hidden="true" className="inline-block h-6 w-5 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${savedMarkerUrl(kind)}")` }}/>{label}</span>)}</p>
      {(query || filter !== 'all') && <button type="button" className="mt-1 min-h-11 text-left font-semibold underline underline-offset-4" onClick={() => { setQuery(''); setFilter('all'); }}>저장한 맛집 필터 해제</button>}
    </div>
    <Button type="button" variant="outline" disabled={!mapCreated || placesLoading || !canSearchPlaces} className="map-search-pig absolute bottom-[calc(5rem+env(safe-area-inset-bottom)+7rem)] right-4 z-20 size-12 min-h-12 !rounded-full !border border-[#d9d8b8] !bg-[#f7f5ef] !p-0 text-xl shadow-lg shadow-[#38432f]/20 hover:!bg-[#efe6d4]" aria-label="이 지역 가게 조회하기" title={placesLoading ? '가게 조회 중' : '이 지역 가게 조회하기'} onClick={searchNearbyPlaces}>🐷</Button>
    <Button type="button" variant="outline" className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom)+3.5rem)] right-4 z-20 size-12 min-h-12 !rounded-full !border border-[#d9d8b8] !bg-[#f7f5ef] !p-0 text-[#4d5b3c] shadow-lg shadow-[#38432f]/20 hover:!bg-[#efe6d4]" aria-label="저장한 맛집 목록 보기" title="저장한 맛집 목록 보기" onClick={() => { setSelectedRestaurant(null); openPanel('list'); }}><List size={20} aria-hidden="true"/></Button>
    <Button type="button" variant="outline" className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-20 size-12 min-h-12 !rounded-full !border border-[#d9d8b8] !bg-[#f7f5ef] !p-0 text-[#4d5b3c] shadow-lg shadow-[#38432f]/20 hover:!bg-[#efe6d4]" aria-label="내 위치로 이동" onClick={() => {
      locate();
      if (location) {
        const maps = window.kakao?.maps;
        if (maps && mapRef.current) mapRef.current.setCenter(new maps.LatLng(location.latitude, location.longitude));
      }
    }}><LocateFixed size={20} strokeWidth={2.2} aria-hidden="true"/></Button>

    <DepthDrawer open={panelDepth > 0} depth={panelDepth} onClose={closeAllPanels} className="map-theme sm:!w-[calc(100vw-3rem)] sm:!max-w-[1200px]">
      {activePanel && <>
        <DrawerHeader className="flex-row shrink-0 items-center justify-between gap-3 border-b border-[var(--map-rule)] px-5 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-left sm:px-8">
          <DrawerTitle className="text-lg font-bold leading-tight text-[var(--map-ink)]">{panelTitles[activePanel]}</DrawerTitle>
          <Button type="button" variant="ghost" className="size-11 min-h-11 shrink-0 rounded-full !p-0" aria-label="전체 닫기" title="전체 닫기" onClick={closeAllPanels}><X size={20} aria-hidden="true"/></Button>
        </DrawerHeader>
        <MapNotebook
          key={`${displayRestaurant?.id ?? `${placeInfo.placeId ?? 'new'}-${lat}-${lng}`}-${activePanel}-${visitToEdit?.id ?? 'new'}`}
          panel={activePanel} items={displayItems} restaurant={displayRestaurant} draft={draft}
          query={query} filter={filter} onQuery={setQuery} onFilter={setFilter} onPanel={pushPanel}
          onSelect={item => { setSelectedRestaurant(item); pushPanel('restaurant'); }}
          visitToEdit={visitToEdit} onVisit={visit => { setVisitToEdit(visit ?? null); pushPanel('visit'); }}
          onDeleteVisit={removeSharedVisit}
          onSave={saveRestaurant} onKakao={openKakaoMap} currentUserId={user?.id ?? null}
          sharedMode={sharedMode} localItemCount={localItemCount} importing={importing}
          importStatus={importStatus} onImport={importLocalRecords}
        />
      </>}
    </DepthDrawer>
  </main>;
}
