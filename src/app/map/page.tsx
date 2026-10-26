'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { getNearestRestaurants, loadRestaurants, saveRestaurants } from '@/lib/restaurants';
import type { Restaurant } from '@/lib/types';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { foodCategories, getFoodCategory, getFoodIcon } from '@/lib/food-categories';
import { ExternalLink, List, LocateFixed, Save, X } from 'lucide-react';

type KakaoLatLng = { getLat: () => number; getLng: () => number };
type KakaoMarker = { setMap: (map: KakaoMap | null) => void; setPosition: (position: unknown) => void };
type KakaoPlace = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  distance: string;
  x: string;
  y: string;
};
type KakaoMap = {
  getCenter: () => KakaoLatLng;
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
          Places: new () => { categorySearch: (code: string, callback: (results: KakaoPlace[], status: string) => void, options: object) => void };
          SortBy: { DISTANCE: string };
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

function makeMarkerImage(maps: NonNullable<Window['kakao']>['maps']) {
  return new maps.MarkerImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg)}`,
    new maps.Size(38, 44),
    { offset: new maps.Point(19, 42), alt: '저장한 맛집 위치 표시' },
  );
}

export default function MapPage() {
  const pathname = usePathname();
  const [items, setItems] = useState<Restaurant[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapCreated, setMapCreated] = useState(false);
  const { location, error: locationError, locate } = useCurrentLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [registrationStep, setRegistrationStep] = useState<'search' | 'form'>('search');
  const [placeCandidates, setPlaceCandidates] = useState<KakaoPlace[]>([]);
  const [candidateCategory, setCandidateCategory] = useState('전체');
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState('');
  const [placeInfo, setPlaceInfo] = useState<Pick<Restaurant, 'placeId' | 'address' | 'phone' | 'placeUrl'>>({});
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const activePointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const placeSearchId = useRef(0);

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
    restaurantMarkersRef.current = restaurants
      .map((restaurant) => addRestaurantMarker(maps, map, restaurant));
    return () => {
      restaurantMarkersRef.current.forEach((marker) => marker.setMap(null));
      restaurantMarkersRef.current = [];
    };
  }, [items, location, mapCreated]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => mapRef.current?.relayout());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  useEffect(() => () => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
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
    setRegistrationStep('search');
    setPlaceCandidates([]);
    setCandidateCategory('전체');
    setPlacesError('');
    setPlacesLoading(true);
    setSelectedRestaurant(null);
    setError('');
    if (pendingMarkerRef.current) pendingMarkerRef.current.setPosition(position);
    else pendingMarkerRef.current = new maps.Marker({ map, position, image: markerImageRef.current, title: '등록 위치' });
    setDialogOpen(true);

    const services = maps.services;
    if (!services) {
      setPlacesLoading(false);
      setPlacesError('가게 검색을 불러오지 못했어요. 직접 등록해 주세요.');
      return;
    }
    const searchId = ++placeSearchId.current;
    new services.Places().categorySearch('FD6', (results, status) => {
      if (searchId !== placeSearchId.current) return;
      setPlacesLoading(false);
      if (status === services.Status.OK) setPlaceCandidates(results);
      else if (status !== services.Status.ZERO_RESULT) setPlacesError('주변 가게를 검색하지 못했어요. 직접 등록해 주세요.');
    }, {
      location: position,
      radius: 1000,
      sort: services.SortBy.DISTANCE,
      size: 15,
    });
  }

  function closeRegistration() {
    placeSearchId.current += 1;
    setDialogOpen(false);
    setSelectedRestaurant(null);
    setError('');
    pendingMarkerRef.current?.setMap(null);
    pendingMarkerRef.current = null;
  }

  function selectPlace(place: KakaoPlace) {
    const maps = window.kakao?.maps;
    const latitude = Number(place.y);
    const longitude = Number(place.x);
    if (!maps || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    setName(place.place_name);
    setCategory(getFoodCategory(place.category_name, place.category_group_code));
    setLat(latitude);
    setLng(longitude);
    setPlaceInfo({
      placeId: place.id,
      address: place.road_address_name || place.address_name,
      phone: place.phone,
      placeUrl: place.place_url,
    });
    pendingMarkerRef.current?.setPosition(new maps.LatLng(latitude, longitude));
    setRegistrationStep('form');
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

  function addRestaurantMarker(maps: NonNullable<Window['kakao']>['maps'], map: KakaoMap, item: Restaurant): KakaoMarker {
    const image = new maps.MarkerImage(getFoodIcon(item.category), new maps.Size(30, 30), {
      offset: new maps.Point(15, 15),
      alt: `${item.category} 음식 아이콘`,
    });
    const marker = new maps.Marker({ map, position: new maps.LatLng(item.latitude, item.longitude), title: item.name, image });
    maps.event.addListener(marker, 'click', () => {
      setSelectedRestaurant(item);
      setDialogOpen(true);
    });
    return marker;
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
    pendingMarkerRef.current?.setMap(null);
    pendingMarkerRef.current = null;
    setName('');
    setNote('');
    setError('');
    setDialogOpen(false);
    return true;
  }

  const candidateCounts = placeCandidates.reduce<Record<string, number>>((counts, place) => {
    const category = getFoodCategory(place.category_name, place.category_group_code);
    counts[category] = (counts[category] ?? 0) + 1;
    return counts;
  }, {});
  const visiblePlaceCandidates = placeCandidates
    .filter((place) => candidateCategory === '전체' || getFoodCategory(place.category_name, place.category_group_code) === candidateCategory)
    .sort((a, b) => categories.indexOf(getFoodCategory(a.category_name, a.category_group_code)) - categories.indexOf(getFoodCategory(b.category_name, b.category_group_code)) || Number(a.distance) - Number(b.distance));
  const candidateCategories = ['전체', ...categories.filter((category) => candidateCounts[category])];

  return <main className="fixed inset-0 z-0 overflow-hidden bg-slate-100 font-sans">
    {key && <Script
      src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`}
      strategy="afterInteractive"
      onReady={() => setReady(true)}
      onError={() => setMapError('카카오 지도를 불러오지 못했어요. 키와 등록 도메인을 확인해 주세요.')}
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
    <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-10 mx-auto max-w-xl px-4">
      <div className="pointer-events-auto mb-2 flex justify-end">
        <Button type="button" variant="outline" onClick={() => setListOpen(true)} className="min-h-10 rounded-full border-[#d9d8b8] bg-[#f7f5ef]/95 px-3 text-xs font-semibold text-[#4d5b3c] shadow-md hover:bg-[#efe6d4]">
          <List size={16} aria-hidden="true"/>목록 보기
        </Button>
      </div>
      {locationError && <div className="pointer-events-auto mt-2 flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-600"><span>{locationError}</span><button type="button" onClick={locate} className="shrink-0 font-semibold text-slate-950">다시 시도</button></div>}
      {mapError && <p role="alert" className="pointer-events-auto mt-2 rounded-md bg-white px-3 py-2 text-sm text-red-700">{mapError}</p>}
      {!key && <p className="pointer-events-auto mt-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700">지도 키 설정이 필요해요.</p>}
    </div>
    <Button type="button" variant="outline" className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-20 size-12 min-h-12 !rounded-full !border border-[#d9d8b8] !bg-[#f7f5ef] !p-0 text-[#4d5b3c] shadow-lg shadow-[#38432f]/20 hover:!bg-[#efe6d4]" aria-label="내 위치로 이동" onClick={() => {
      locate();
      if (location) {
        const maps = window.kakao?.maps;
        if (maps && mapRef.current) mapRef.current.setCenter(new maps.LatLng(location.latitude, location.longitude));
      }
    }}><LocateFixed size={20} strokeWidth={2.2} aria-hidden="true"/></Button>

    <Drawer open={listOpen} onOpenChange={setListOpen}>
      <DrawerContent>
        <DrawerHeader className="px-5 pb-3 text-left">
          <DrawerTitle className="text-[#3f4b32]">저장한 맛집</DrawerTitle>
        </DrawerHeader>
        <div className="map-scrollbar-hidden min-h-0 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {items.length ? <ul className="space-y-2">
            {items.map((item) => <li key={item.id}>
              <button type="button" onClick={() => { setListOpen(false); setSelectedRestaurant(item); setDialogOpen(true); }} className="flex w-full items-center gap-3 rounded-xl border border-[#e6e1d1] bg-[#f7f5ef] p-3 text-left transition-colors hover:bg-[#efe6d4]">
                <Image src={getFoodIcon(item.category)} width={30} height={30} alt="" aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#3f4b32]">{item.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-[#777765]">{item.category}{item.address ? ` · ${item.address}` : ''}</span>
                </span>
              </button>
            </li>)}
          </ul> : <p className="px-1 py-8 text-center text-sm text-[#777765]">저장한 맛집이 없어요.</p>}
        </div>
      </DrawerContent>
    </Drawer>

    <dialog
      ref={dialogRef}
      className="map-dialog"
      aria-labelledby="restaurant-dialog-title"
      aria-describedby={selectedRestaurant || registrationStep === 'search' ? 'restaurant-dialog-description' : undefined}
      onClose={closeRegistration}
      onCancel={(event) => { event.preventDefault(); closeRegistration(); }}
      onClick={(event) => { if (event.target === event.currentTarget) closeRegistration(); }}
    >
      <Card className={`map-dialog-panel map-scrollbar-hidden relative mx-auto w-[calc(100%-2rem)] max-w-lg ${!selectedRestaurant && registrationStep === 'search' ? 'flex h-[min(82dvh,680px)] flex-col overflow-hidden' : 'max-h-[85dvh] overflow-y-auto'}`}>
        <CardHeader className="flex-row shrink-0 items-center justify-between gap-3 rounded-t-xl border-b border-[#e6e1d1] bg-[#f7f5ef]/75 px-4 py-2.5">
          <div className="space-y-1">
            <CardTitle id="restaurant-dialog-title" className="text-lg font-bold leading-tight text-[#3f4b32]">{selectedRestaurant?.name ?? (registrationStep === 'search' ? '이 가게가 맞나요?' : '맛집 등록')}</CardTitle>
            {(selectedRestaurant || registrationStep === 'search') && <CardDescription id="restaurant-dialog-description">{selectedRestaurant ? `${selectedRestaurant.category} · 저장한 맛집` : '가까운 음식점 중에서 골라 줘.'}</CardDescription>}
          </div>
          <Button type="button" variant="ghost" className="size-8 min-h-8 shrink-0 rounded-full !p-0" aria-label="닫기" onClick={closeRegistration}>
            <X size={14} aria-hidden="true"/>
          </Button>
        </CardHeader>
        <CardContent className={!selectedRestaurant && registrationStep === 'search' ? 'flex min-h-0 flex-1 flex-col overflow-hidden p-4 pt-4' : 'p-4 pt-4'}>
          {selectedRestaurant ? <div className="space-y-4">
            {selectedRestaurant.address && <p className="text-sm text-slate-600">{selectedRestaurant.address}</p>}
            {selectedRestaurant.phone && <a className="block text-sm text-slate-700 underline" href={`tel:${selectedRestaurant.phone}`}>{selectedRestaurant.phone}</a>}
            {selectedRestaurant.note && <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedRestaurant.note}</p>}
            <Button type="button" variant="outline" className="w-full" onClick={() => openKakaoMap(selectedRestaurant)}><ExternalLink size={15} aria-hidden="true"/>카카오맵에서 보기</Button>
            <Button type="button" className="w-full" onClick={closeRegistration}>닫기</Button>
          </div> : registrationStep === 'search' ? <div className="flex min-h-0 flex-1 flex-col gap-3">
            {placesLoading && <p className="py-5 text-center text-sm text-slate-500">주변 가게 찾는 중…</p>}
            {placesError && <p role="alert" className="text-sm text-slate-600">{placesError}</p>}
            {!placesLoading && !placesError && placeCandidates.length === 0 && <p className="py-4 text-center text-sm text-slate-500">주변에 검색된 가게가 없어.</p>}
            {placeCandidates.length > 0 && <>
              <div className="grid shrink-0 grid-cols-3 gap-2 pb-1" role="group" aria-label="음식 종류 필터">
                {candidateCategories.map((category) => <button key={category} type="button" aria-pressed={candidateCategory === category} onClick={() => setCandidateCategory(category)} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-medium transition-colors ${candidateCategory === category ? 'border-[#4d5b3c] bg-[#4d5b3c] text-[#f7f5ef]' : 'border-[#d9d8b8] bg-[#f7f5ef] text-[#5d604d] hover:bg-[#efe6d4]'}`}>
                  {category !== '전체' && <Image src={getFoodIcon(category)} width={16} height={16} alt="" aria-hidden="true"/>}
                  {category}<span>{category === '전체' ? placeCandidates.length : candidateCounts[category]}</span>
                </button>)}
              </div>
              <div className="map-scrollbar-hidden min-h-0 flex-1 space-y-2 overflow-y-auto">
                {visiblePlaceCandidates.map((place) => <Button key={place.id} type="button" variant="outline" className="h-auto w-full justify-start whitespace-normal !p-2.5 text-left" onClick={() => selectPlace(place)}>
                  <Image className="shrink-0" src={getFoodIcon(getFoodCategory(place.category_name, place.category_group_code))} width={28} height={28} alt="" aria-hidden="true"/>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-950">{place.place_name}<span className="ml-2 text-xs font-normal text-slate-500">{place.distance}m</span></span>
                    <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{getFoodCategory(place.category_name, place.category_group_code)} · {place.road_address_name || place.address_name}</span>
                  </span>
                </Button>)}
              </div>
            </>}
            <Button type="button" variant="ghost" className="w-full" onClick={() => setRegistrationStep('form')}>직접 등록</Button>
          </div> : <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); add(); }}>
            <fieldset className="space-y-1.5">
              <div className="grid grid-cols-5 gap-2" role="group" aria-label="음식 종류 선택">
                {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border text-[11px] font-medium transition-colors ${category === item ? 'border-[#4d5b3c] bg-[#4d5b3c] text-[#f7f5ef]' : 'border-[#d9d8b8] bg-[#f7f5ef] text-[#5d604d] hover:bg-[#efe6d4]'}`}>
                  <Image src={getFoodIcon(item)} width={22} height={22} alt="" aria-hidden="true"/>
                  {item}
                </button>)}
              </div>
            </fieldset>
            {placeInfo.address && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{placeInfo.address}{placeInfo.phone ? ` · ${placeInfo.phone}` : ''}</p>}
            <Input aria-label="가게 이름" className="h-10" value={name} onChange={(event) => setName(event.target.value)} placeholder="가게 이름"/>
            <Input aria-label="메모" className="h-10" value={note} onChange={(event) => setNote(event.target.value)} placeholder="뭐든써봐"/>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full !bg-[#66734b] hover:!bg-[#556340]"><Save size={16} aria-hidden="true"/>맛집 저장</Button>
          </form>}
        </CardContent>
      </Card>
    </dialog>
  </main>;
}
