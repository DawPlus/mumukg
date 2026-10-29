'use client';

import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { IconButton, IconButtonParticles } from '@animate-ui/react/primitives/buttons/icon';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import PeekRating from '@/components/ui/peek-rating';
import { toast } from '@/components/ui/toast';
import { getFoodIcon } from '@/lib/food-categories';
import { ChevronDown, Plus } from 'lucide-react';
import { AnimateIcon } from '@animate-ui/react/icons';
import { Copy01 } from '@/components/animate-ui/icons/hugeicons/copy-01';
import { PhoneCall } from '@/components/animate-ui/icons/hugeicons/phone-call';
import { Route } from '@/components/animate-ui/icons/hugeicons/route';
import { Location01 } from '@/components/animate-ui/icons/hugeicons/location-01';
import { Favourite } from '@/components/animate-ui/icons/hugeicons/favourite';
import {
  composeVisitPost, findRestaurants, isFavorite, getOtherMemberMemories, getVisits, memoryTags, revisitLabels, todayLocal, validVisitDate, visitHighlights, withVisits,
  type MapRestaurant, type MapVisit, type RestaurantFilter, type Revisit,
} from './restaurant-memory';
import { canManageMapVisit, canUpdateMapPlace } from '@/lib/map-import';
import type { MapRecordSaveOptions } from '@/lib/map-db';

export type MapPanel = 'list' | 'restaurant' | 'memory' | 'visit';
export const panelTitles: Record<MapPanel, string> = {
  list: '저장한 맛집', restaurant: '나의 맛집 노트', memory: '기억 수정', visit: '방문 기록',
};
const filters: { value: RestaurantFilter; label: string }[] = [
  { value: 'all', label: '전체' }, { value: 'wish', label: '하트 저장' },
  { value: 'revisit', label: '다시 갈 곳' }, { value: 'recent', label: '최근 방문순' },
];
const blankVisit = (): MapVisit => ({ id: '', date: todayLocal(), stars: undefined, menu: '', reason: '' });
const visitNote = (visit: MapVisit) => [visit.menu.trim(), visit.reason.trim()].filter(Boolean).join(' ');
const restaurantMemoryText = (item: Pick<MapRestaurant, 'memory' | 'nextMenu' | 'note'>) => [item.memory, item.nextMenu, item.note].map(value => value?.trim()).filter(Boolean).join('\n');
const quickHighlights = ['맛있음', '가성비', '혼밥', '조용함', '대기 김', '주차 편함'];
const highlightEmoji: Record<string, string> = { 맛있음: '🍽️', 가성비: '💰', 혼밥: '🧍', 조용함: '🌿', '대기 김': '⏳', '주차 편함': '🚗' };
const memoryTagEmoji: Record<string, string> = { '혼밥 좋음': '🧍', 가성비: '💰', 조용함: '🌿', 시끄러움: '📣', '대기 김': '⏳', '주차 편함': '🚗' };
const revisitEmoji: Record<Revisit, string> = { yes: '💚', maybe: '🤔', no: '🙅' };

function VisitFields({ value, onChange }: { value: MapVisit; onChange: (value: MapVisit) => void }) {
  const [dateOpen, setDateOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const post = composeVisitPost(value);
  function toggleHighlight(tag: string) {
    const selected = value.highlights ?? [];
    onChange({ ...value, highlights: selected.includes(tag) ? selected.filter(item => item !== tag) : selected.length < 3 ? [...selected, tag] : selected });
  }
  return <div className="space-y-5">
    <fieldset className="space-y-2">
      <legend className="map-field-label">다시 가고 싶어?</legend>
      <div className="grid grid-cols-3 gap-2">{(Object.keys(revisitLabels) as Revisit[]).map((intent, index) =>
        <Button key={intent} type="button" variant="outline" hoverScale={1.035} tapScale={0.92} className="map-choice map-choice-enter" style={{ animationDelay: `${index * 45}ms` }} aria-pressed={value.revisit === intent} onClick={() => onChange({ ...value, revisit: value.revisit === intent ? undefined : intent })}><span aria-hidden="true" className="map-choice-emoji">{revisitEmoji[intent]}</span>{revisitLabels[intent]}</Button>,
      )}</div>
    </fieldset>
    <fieldset className="space-y-2">
      <legend className="map-field-label">기억할 장면 <span className="map-muted font-normal">· 3개까지</span></legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{visitHighlights.filter(({ label }) => quickHighlights.includes(label) || value.highlights?.includes(label)).map(({ label }, index) => <Button key={label} type="button" variant="outline" hoverScale={1.035} tapScale={0.92} className="map-choice map-choice-enter justify-start gap-2" style={{ animationDelay: `${index * 35}ms` }} aria-pressed={value.highlights?.includes(label) ?? false} onClick={() => toggleHighlight(label)}><span aria-hidden="true" className="map-choice-emoji">{highlightEmoji[label] ?? '✨'}</span>{label}</Button>)}</div>
    </fieldset>
    <section className="map-post-preview" aria-label="자동 완성 후기 미리보기" aria-live="polite" aria-atomic="true">
      <p className="map-muted text-xs">선택한 내용으로 후기 완성</p>
      <p key={post} className="map-generated-post mt-2 text-base font-medium leading-7">{post || '다시 갈지와 기억할 장면을 골라봐요.'}</p>
    </section>
    <details className="map-extra-details" open={extrasOpen} onToggle={event => setExtrasOpen(event.currentTarget.open)}>
      <summary><span className="map-extra-plus"><Plus size={18} aria-hidden="true"/></span><span className="map-extra-copy"><strong>별점·메뉴·날짜</strong><small>필요한 것만 추가해요</small></span><span className="map-extra-action">선택 <ChevronDown size={16} aria-hidden="true"/></span></summary>
      <div className="mt-4 space-y-5">
        <label className="map-field">먹은 메뉴와 한마디<textarea maxLength={1000} rows={2} value={visitNote(value)} onChange={e => onChange({ ...value, menu: '', reason: e.target.value })} placeholder="예: 들깨칼국수, 양 넉넉하고 맛있었어요"/></label>
        <fieldset className="space-y-2">
          <legend className="map-field-label">별점 <span className="map-muted font-normal">· 선택</span></legend>
          <div className="flex min-h-12 flex-wrap items-center gap-3">
            <PeekRating value={value.stars ?? 0} onChange={stars => onChange({ ...value, stars: stars || undefined })} size={36} count={5} labels={['1점', '2점', '3점', '4점', '5점']} activeColor="var(--map-ink)" idleColor="var(--map-sage)" showTip={false} ariaLabel="이번 방문 별점"/>
            <span className="text-sm tabular-nums">{value.stars ? `${value.stars} / 5` : '평가 전'}</span>
          </div>
        </fieldset>
        <div className="space-y-2">
          <p className="map-field-label">방문 날짜</p>
          <Button type="button" variant="outline" className="map-choice w-full justify-between" aria-label={`방문 날짜: ${value.date || '날짜 미상'}`} aria-expanded={dateOpen} onClick={() => setDateOpen(!dateOpen)}><span>{value.date ? value.date.replaceAll('-', '.') : '날짜를 선택해 주세요'}</span><span>변경</span></Button>
          {dateOpen && <Calendar className="map-date-picker w-full rounded-xl border border-[var(--map-rule)] bg-white [--cell-size:2rem]" locale={ko} mode="single" captionLayout="dropdown" defaultMonth={value.date ? parseISO(value.date) : new Date()} selected={value.date ? parseISO(value.date) : undefined} disabled={{ after: new Date() }} onSelect={date => { if (date) { onChange({ ...value, date: format(date, 'yyyy-MM-dd') }); setDateOpen(false); } }}/>}
        </div>
      </div>
    </details>
  </div>;
}

function VisitSummary({ visit }: { visit?: MapVisit }) {
  if (!visit) return <span className="map-visit-unrated">아직 방문 전</span>;
  const intent = visit.revisit ? revisitLabels[visit.revisit] : visit.legacySatisfaction ? (visit.legacySatisfaction === 'satisfied' ? '만족' : '불만족') : null;
  const highlights = visit.highlights ?? [];
  if (!visit.stars && !intent && !highlights.length) return <span className="map-visit-unrated">방문만 기록했어요</span>;
  return <span className="map-visit-summary">
    {!!visit.stars && <span className="map-visit-stars"><span aria-hidden="true">★</span> {visit.stars}<small>/5</small></span>}
    {intent && <span>{intent}</span>}
    {highlights.map(tag => <span key={tag} className="map-visit-highlight">{tag}</span>)}
  </span>;
}

function PlaceInfo({ item, onKakao, headerActions, date }: { item: MapRestaurant; onKakao: (item: MapRestaurant) => void; headerActions?: ReactNode; date?: string }) {
  const [parcel, setParcel] = useState(false);
  const road = item.kakaoPlace?.road_address_name;
  const lot = item.kakaoPlace?.address_name;
  const address = (parcel ? lot : road) || lot || item.address;
  async function copyAddress() {
    if (!address) return;
    try { await navigator.clipboard.writeText(address); toast.add({ title: '주소를 복사했어요.' }); }
    catch { toast.add({ title: '주소를 복사하지 못했어요.' }); }
  }
  if (headerActions) return <header className="map-place-header">
    <div className="map-place-identity">
      <Image src={getFoodIcon(item.category)} width={32} height={32} alt=""/>
      <h2>{item.name}</h2>
      {date && <time dateTime={date}>{date.replaceAll('-', '.')}</time>}
    </div>
    <p className="map-place-location">{address || '주소 정보 없음'}</p>
    <div className="map-place-toolbar" role="group" aria-label="가게 바로가기">
      {road && lot && <AnimateIcon asChild animateOnHover animateOnTap completeOnStop><Button type="button" variant="ghost" className="map-header-action map-header-pin" aria-label={`${parcel ? '도로명' : '지번'} 주소로 전환`} title="주소 종류 바꾸기" onClick={() => setParcel(!parcel)}><Location01 size={18} aria-hidden="true"/></Button></AnimateIcon>}
      {address && <AnimateIcon asChild animateOnHover animateOnTap completeOnStop><Button type="button" variant="ghost" className="map-header-action" aria-label="주소 복사" title="주소 복사" onClick={copyAddress}><Copy01 size={18} aria-hidden="true"/></Button></AnimateIcon>}
      {item.phone && <AnimateIcon asChild animateOnHover animateOnTap completeOnStop><a className="map-header-action map-header-phone" href={`tel:${item.phone}`} aria-label={`전화 걸기 ${item.phone}`} title="전화"><PhoneCall size={18} aria-hidden="true"/></a></AnimateIcon>}
      <AnimateIcon asChild animateOnHover animateOnTap completeOnStop><Button type="button" variant="ghost" className="map-header-action map-header-map" aria-label="카카오맵에서 가게 보기" title="카카오맵" onClick={() => onKakao(item)}><Route size={18} aria-hidden="true"/></Button></AnimateIcon>
      {headerActions}
    </div>
  </header>;
  return <section className="map-place-card" aria-label="가게 정보">
    <div className="map-place-leading">
      {road && lot ? <Button type="button" variant="ghost" className="map-place-pin" aria-label={`${parcel ? '지번' : '도로명'} 주소로 전환`} title="주소 종류 바꾸기" onClick={() => setParcel(!parcel)}><span className="map-pin-emoji" aria-hidden="true">📍</span></Button> : <span className="map-place-pin" aria-hidden="true"><span className="map-pin-emoji">📍</span></span>}
      {address ? <Button type="button" variant="ghost" className="map-place-address" aria-label="주소 복사" title={address} onClick={copyAddress}><span className="map-address-text">{address}</span></Button> : <span className="map-place-address">주소 정보 없음</span>}
    </div>
    <div className="map-place-actions">
      {item.phone && <a className="map-place-action map-place-phone" href={`tel:${item.phone}`} aria-label={`전화 걸기 ${item.phone}`} title="전화"><span className="map-action-emoji" aria-hidden="true">📞</span></a>}
      <Button type="button" variant="ghost" className="map-place-action map-place-map" aria-label="카카오맵에서 가게 보기" title="카카오맵" onClick={() => onKakao(item)}><span className="map-action-emoji" aria-hidden="true">🗺️</span></Button>
    </div>
  </section>;
}

export function MapNotebook({ panel, items, restaurant, draft, query, filter, onQuery, onFilter, onPanel, onSelect, onSave, onKakao, visitToEdit, onVisit, onDeleteVisit, currentUserId, sharedMode, localItemCount, importing, importStatus, onImport }: {
  panel: MapPanel;
  items: MapRestaurant[];
  restaurant: MapRestaurant | null;
  draft: MapRestaurant;
  query: string;
  filter: RestaurantFilter;
  onQuery: (query: string) => void;
  onFilter: (filter: RestaurantFilter) => void;
  onPanel: (panel: MapPanel) => void;
  onSelect: (item: MapRestaurant) => void;
  visitToEdit: MapVisit | null;
  onVisit: (visit?: MapVisit) => void;
  onDeleteVisit: (visitId: string) => Promise<boolean>;
  onSave: (item: MapRestaurant, options?: MapRecordSaveOptions) => Promise<boolean>;
  onKakao: (item: MapRestaurant) => void;
  currentUserId: string | null;
  sharedMode: boolean;
  localItemCount: number;
  importing: boolean;
  importStatus: string;
  onImport: () => void;
}) {
  const item = restaurant ?? draft;
  const heartGradientId = useId();
  const [memory, setMemory] = useState({ name: item.name, text: restaurantMemoryText(item), tags: item.tags ?? [] });
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [visit, setVisit] = useState<MapVisit>(() => panel === 'visit' && visitToEdit ? { ...visitToEdit } : blankVisit());
  const draftRestaurantId = useRef('');
  const editingVisit = !!visitToEdit;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const visits = restaurant ? getVisits(restaurant) : [];
  const latest = visits[0];
  const canEditName = !sharedMode || !item.createdBy || canUpdateMapPlace(item.createdBy, currentUserId ?? '');

  async function save(next: MapRestaurant, options?: MapRecordSaveOptions) {
    if (saveLock.current) return false;
    saveLock.current = true;
    setSaving(true);
    try {
      if (!await onSave(next, options)) throw new Error('save failed');
      setError('');
      setDeleting(false);
      return true;
    } catch {
      setError('저장하지 못했어요. 입력은 유지돼요. 연결 상태와 멤버 권한을 확인한 뒤 다시 시도해 주세요.');
      return false;
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  async function toggleFavorite() {
    if (!memory.name.trim()) { setError('가게 이름을 입력해 주세요.'); return; }
    const favorite = restaurant ? !isFavorite(restaurant) : true;
    await save({
      ...item, id: item.id || (draftRestaurantId.current ||= crypto.randomUUID()),
      name: restaurant ? item.name : memory.name.trim(),
      createdAt: item.createdAt || new Date().toISOString(), isFavorite: favorite,
      ...(!restaurant ? { memory: memory.text.trim(), tags: memory.tags } : {}),
    }, { createPlace: !restaurant, favorite, ...(!restaurant ? { memory: true } : {}) });
  }

  const heartButton = <AnimateIcon asChild animateOnHover animateOnTap completeOnStop><IconButton type="button" className="map-heart-button" disabled={saving} aria-busy={saving} aria-label={restaurant && isFavorite(restaurant) ? '하트 저장 해제' : '하트로 저장'} aria-pressed={!!restaurant && isFavorite(restaurant)} onClick={() => void toggleFavorite()}>
    <Favourite size={18} strokeWidth={1.5} fill={restaurant && isFavorite(restaurant) ? `url(#${heartGradientId})` : 'none'} aria-hidden="true" decoration={<>
      <defs><linearGradient id={heartGradientId} x1="0" y1="0" x2=".75" y2="1"><stop offset="0%" stopColor="#F5B5A8"/><stop offset="48%" stopColor="#D97970"/><stop offset="100%" stopColor="#B4534B"/></linearGradient></defs>
      {restaurant && isFavorite(restaurant) && <path d="M6 9c.3-1.5 1.4-2.1 2.7-1.8" fill="none" stroke="white" strokeOpacity=".75" strokeWidth="1.5" strokeLinecap="round"/>}
    </>}/>
    <IconButtonParticles size={5}/>
  </IconButton></AnimateIcon>;

  async function submitVisit(event: FormEvent) {
    event.preventDefault();
    if (!restaurant) return;
    if (editingVisit && !canManageMapVisit(visit, currentUserId, sharedMode)) { setError('내가 남긴 방문만 수정할 수 있어요.'); return; }
    if (!validVisitDate(visit.date)) { setError('오늘까지의 올바른 방문 날짜를 선택해 주세요.'); return; }
    const value = { ...visit, id: visit.id || crypto.randomUUID(), menu: visit.menu.trim(), reason: visit.reason.trim(), highlights: visit.highlights ?? [] };
    setVisit(value);
    const history = [...visits].reverse();
    await save(withVisits(restaurant, editingVisit ? history.map(v => v.id === value.id ? value : v) : [...history, value]), { visits: [value] });
  }

  async function submitMemory(event: FormEvent) {
    event.preventDefault();
    if (!memory.name.trim()) { setError('가게 이름을 입력해 주세요.'); return; }
    const id = item.id || (draftRestaurantId.current ||= crypto.randomUUID());
    const next: MapRestaurant = {
      ...item, id, isFavorite: restaurant ? isFavorite(restaurant) : false, createdAt: item.createdAt || new Date().toISOString(),
      name: memory.name.trim(), memory: memory.text.trim(), nextMenu: '', note: '', tags: memory.tags,
    };
    const options: MapRecordSaveOptions = {
      createPlace: !restaurant,
      memory: true,
      ...(restaurant && memory.name.trim() !== restaurant.name ? { placeName: memory.name.trim() } : {}),
    };
    await save(next, options);
  }

  if (panel === 'list') {
    const hasSaved = findRestaurants(items, '', 'all').length > 0;
    const visible = findRestaurants(items, query, filter);
    return <div className="map-notebook flex-1 overflow-y-auto px-5 pb-8 sm:px-8">
      <div className="sticky top-0 z-10 space-y-3 bg-[var(--map-paper)] py-4">
        {sharedMode && localItemCount > 0 && <section className="rounded-xl border border-[var(--map-rule)] bg-white/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">이 기기의 기록 {localItemCount}곳을 공유 지도에 가져올 수 있어요.</p><Button type="button" variant="outline" className="map-choice min-h-11" disabled={importing} onClick={onImport}>{importing ? '가져오는 중…' : '기록 가져오기'}</Button></div>
          {importStatus && <p role="status" className="mt-2 text-xs leading-5">{importStatus}</p>}
        </section>}
        <Input aria-label="저장한 맛집 검색" value={query} onChange={e => onQuery(e.target.value)} placeholder="가게 · 메뉴 · 기억 검색"/>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="맛집 필터">{filters.map(({ value, label }) => <Button key={value} type="button" variant="outline" hoverScale={1.035} tapScale={0.92} className="map-choice" aria-pressed={filter === value} onClick={() => onFilter(value)}>{label}</Button>)}</div>
        <p className="map-muted text-sm" aria-live="polite">{visible.length}곳{filter === 'recent' ? ' · 방문 날짜가 있는 기록부터' : ''}</p>
      </div>
      {visible.length ? <ul className="grid gap-x-8 lg:grid-cols-2">{visible.map(saved => {
        const recent = getVisits(saved)[0];
        return <li key={saved.id} className="min-w-0 border-b border-[var(--map-rule)]">
          <button type="button" onClick={() => onSelect(saved)} className="map-saved-row w-full py-5 text-left">
            <div className="flex items-start gap-3">
              <Image src={getFoodIcon(saved.category)} width={36} height={36} alt="" className="shrink-0"/>
              <div className="min-w-0 flex-1"><h3 className="break-words text-base font-semibold">{saved.name}</h3><p className="map-muted mt-1 text-sm">{isFavorite(saved) ? '♥ 하트 저장' : recent ? '다녀온 곳' : '가게 기억'}{recent?.date ? ` · ${recent.date.replaceAll('-', '.')}` : ''}</p></div>
              <span aria-hidden="true" className="text-lg">›</span>
            </div>
            <p className="mt-3 whitespace-pre-line break-words text-sm font-medium leading-6">{restaurantMemoryText(saved) || recent?.reason || '아직 남긴 기억이 없어요.'}</p>
            {recent && <p className="mt-2 text-xs leading-5"><VisitSummary visit={recent}/></p>}
            {!!saved.tags?.length && <p className="map-muted mt-2 text-xs leading-5">{saved.tags.join(' · ')}</p>}
          </button>
        </li>;
      })}</ul> : <div className="py-12 text-center"><p className="font-semibold">{hasSaved ? '조건에 맞는 맛집이 없어요.' : '기억하고 싶은 가게를 모아봐요.'}</p><p className="map-muted mt-2 text-sm">{hasSaved ? '다른 단어로 검색하거나 필터를 바꿔보세요.' : '지도에서 가게를 조회하거나 원하는 위치를 길게 눌러 저장해요.'}</p>{hasSaved && <Button type="button" variant="outline" className="map-choice mt-5" onClick={() => { onQuery(''); onFilter('all'); }}>검색·필터 초기화</Button>}</div>}
    </div>;
  }

  if (panel === 'visit' && restaurant) return <form className="map-notebook flex min-h-0 flex-1 flex-col" onSubmit={submitVisit}>
    <div className="map-registration-body flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-8">
      <div><h2 className="text-xl font-semibold">{restaurant.name}</h2><p className="map-muted mt-1 text-sm">{editingVisit ? '지난 방문의 기록을 고쳐요.' : '평가만 남겨도 괜찮아요.'}</p></div>
      <VisitFields value={visit} onChange={setVisit}/>
      {editingVisit && <div className="border-t border-[var(--map-rule)] pt-4">
        {deleting ? <div role="group" aria-label="방문 기록 삭제 확인" className="space-y-3"><p className="text-sm">이 방문 기록을 삭제할까요? 가게와 다른 방문 기록은 남아요.</p><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="map-choice" onClick={() => setDeleting(false)}>취소</Button><Button type="button" className="map-danger" onClick={() => { void (async () => {
          if (!canManageMapVisit(visit, currentUserId, sharedMode)) { setError('내가 남긴 방문만 삭제할 수 있어요.'); return; }
          if (sharedMode) {
            if (await onDeleteVisit(visit.id)) { setDeleting(false); setError(''); }
            else setError('삭제하지 못했어요. 연결과 권한을 확인해 주세요.');
          } else await save(withVisits(restaurant, [...visits].reverse().filter(v => v.id !== visit.id)));
        })(); }}>이 기록 삭제</Button></div></div>
          : <Button type="button" variant="ghost" className="map-text-button text-[var(--map-danger)]!" onClick={() => setDeleting(true)}>방문 기록 삭제</Button>}
      </div>}
    </div>
    <div className="map-footer">{error && <p role="alert" className="map-error mb-3">{error}</p>}<Button type="submit" className="map-primary">{editingVisit ? '변경 저장' : '방문 기록 저장'}</Button></div>
  </form>;

  if (panel === 'memory' || !restaurant) return <form className="map-notebook flex min-h-0 flex-1 flex-col" onSubmit={submitMemory}>
    <div className="map-registration-body flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-8">
      <div className="flex items-center gap-3"><Image src={getFoodIcon(item.category)} width={48} height={48} alt=""/><div className="min-w-0 flex-1"><h2 className="text-xl font-semibold">{restaurant ? '다음의 나를 위한 기억' : item.name || '새 맛집 저장'}</h2>{(item.placeId || item.address || item.phone || item.kakaoPlace) && <PlaceInfo item={item} onKakao={onKakao}/>}</div></div>
      {!item.placeId && canEditName && <label className="map-field">가게 이름<Input required maxLength={100} value={memory.name} onChange={e => setMemory({ ...memory, name: e.target.value })} placeholder="가게 이름"/></label>}
      {!restaurant && <div className="map-heart-save">{heartButton}<div><strong>하트로 저장</strong><p>기억은 필요할 때 더해요</p></div></div>}
      <details className="map-extra-details">
        <summary><span className="map-extra-plus"><Plus size={18} aria-hidden="true"/></span><span className="map-extra-copy"><strong>가게 기억 더하기</strong><small>특징·메모·가게 정보</small></span><span className="map-extra-action">선택 <ChevronDown size={16} aria-hidden="true"/></span></summary>
        <div className="mt-4 space-y-5">
          <fieldset className="space-y-2"><legend className="map-field-label">가게 특징</legend><div className="flex flex-wrap gap-2">{[...new Set([...memoryTags, ...memory.tags])].map(tag => <Button key={tag} type="button" variant="outline" hoverScale={1.035} tapScale={0.92} className="map-choice" aria-pressed={memory.tags.includes(tag)} onClick={() => setMemory({ ...memory, tags: memory.tags.includes(tag) ? memory.tags.filter(t => t !== tag) : [...memory.tags, tag] })}><span aria-hidden="true" className="map-choice-emoji">{memoryTagEmoji[tag] ?? '✨'}</span>{tag}</Button>)}</div></fieldset>
          <label className="map-field">가게 기억<textarea maxLength={1000} rows={3} value={memory.text} onChange={e => setMemory({ ...memory, text: e.target.value })} placeholder="예: 점심엔 대기가 길어요 · 다음엔 수육 먹기"/></label>
        </div>
      </details>
    </div>
    <div className="map-footer">{error && <p role="alert" className="map-error mb-3">{error}</p>}<Button type="submit" disabled={saving || (!restaurant && !memory.text.trim() && !memory.tags.length)} className="map-primary">{saving ? '저장 중…' : '기억 저장'}</Button></div>
  </form>;

  const datedVisits = visits.filter(v => v.date);
  const now = new Date();
  const monthlyVisits = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { month, label: `${date.getMonth() + 1}월`, count: datedVisits.filter(v => v.date.startsWith(month)).length };
  });
  const chartTotal = monthlyVisits.reduce((total, month) => total + month.count, 0);
  const maxVisits = Math.max(1, ...monthlyVisits.map(month => month.count));
  const chartPoints = monthlyVisits.map((month, index) => ({ ...month, x: index * 30 + 15, y: 86 - month.count / maxVisits * 52 }));
  const chartLine = chartPoints.reduce((path, point, index) => {
    if (!index) return `M ${point.x} ${point.y}`;
    const previous = chartPoints[index - 1]!;
    const middle = (previous.x + point.x) / 2;
    return `${path} C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  const latestChartMonth = [...chartPoints].reverse().find(point => point.count)?.month;
  return <div className="map-notebook flex min-h-0 flex-1 flex-col">
    <div className="map-detail-body flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-8">
      <PlaceInfo item={restaurant} onKakao={onKakao} headerActions={heartButton} date={latest?.date}/>
      {error && <p role="alert" className="map-error">{error}</p>}
      <section className="map-visit-chart" aria-label="최근 12개월 방문 횟수">
        <div className="map-visit-chart-heading"><h3>최근 12개월 방문</h3><strong>{chartTotal}회</strong></div>
        <svg viewBox="0 0 360 120" className="map-visit-chart-svg" role="img" aria-label={monthlyVisits.map(month => `${month.month} ${month.count}회`).join(', ')}>
          {[38, 62, 86].map(y => <line key={y} x1="15" x2="345" y1={y} y2={y} stroke="var(--map-rule)" strokeOpacity=".45"/>)}
          <path className={`visit-chart-line${chartTotal ? '' : ' visit-chart-line-empty'}`} d={chartLine} pathLength="1" fill="none" stroke="var(--map-chart-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          {chartTotal > 0 && <>
            <path className="visit-chart-flow" d={chartLine} pathLength="1" fill="none" stroke="var(--map-chart-light)" strokeWidth="3" strokeLinecap="round"/>
            <circle className="visit-chart-traveler" r="4" fill="var(--map-chart-accent)" stroke="var(--map-paper)" strokeWidth="2" aria-hidden="true">
              <animateMotion path={chartLine} dur="4s" begin="1s" repeatCount="indefinite" calcMode="paced"/>
            </circle>
          </>}
          {chartPoints.map((point, index) => <g key={point.month}>
            {point.count > 0 && <>{point.month === latestChartMonth && <circle className="visit-chart-point-halo" cx={point.x} cy={point.y} r="8"/>}<circle className={`visit-chart-point${point.month === latestChartMonth ? ' visit-chart-point-current' : ''}`} style={{ animationDelay: `${700 + index * 35}ms` }} cx={point.x} cy={point.y} r="4" fill="var(--map-paper)" stroke="var(--map-ink)" strokeWidth="2"/><text className="visit-chart-count" style={{ animationDelay: `${700 + index * 35}ms` }} x={point.x} y={point.y - 9} textAnchor="middle" fontSize="11" fill="var(--map-ink)">{point.count}</text></>}
            <text x={point.x} y="110" textAnchor="middle" fontSize="12" fill="var(--map-muted)">{point.label}</text>
          </g>)}
        </svg>
        {!chartTotal && <p className="map-muted text-xs">방문을 기록하면 월별 횟수가 보여요.</p>}
      </section>
      <section className="map-memory-card">
        <div className="flex flex-wrap items-center justify-between gap-x-3"><h3 className="map-field-label">가게 기억</h3><Button type="button" variant="ghost" className="map-text-button" onClick={() => { setMemory({ name: restaurant.name, text: restaurantMemoryText(restaurant), tags: restaurant.tags ?? [] }); setError(''); onPanel('memory'); }}>기억 수정</Button></div>
        <p className="map-memory-text mt-1 whitespace-pre-wrap break-words">{restaurantMemoryText(restaurant) || latest?.reason || '어떤 곳이었는지 한 줄 남겨봐요.'}</p>
        <p className="map-memory-summary mt-2 text-sm leading-6"><VisitSummary visit={latest}/></p>
        {latest && !latest.date && <p className="map-muted mt-1 text-xs">기존 기록 · 방문 날짜 미상</p>}
        {!!restaurant.tags?.length && <ul className="mt-4 flex flex-wrap gap-2">{restaurant.tags.map(tag => <li key={tag} className="map-tag">{tag}</li>)}</ul>}
      </section>
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-base font-semibold">방문 기록</h3><p className="map-muted text-sm">{datedVisits.length}회{visits.length > datedVisits.length ? ` · 날짜 미상 ${visits.length - datedVisits.length}개` : ''}</p></div>
        {visits.length ? <ul className="map-visit-history">{visits.map(v => <li key={v.id} className="map-visit-entry">
          <div className="flex items-center justify-between gap-2"><p className="map-muted text-sm">{v.date ? v.date.replaceAll('-', '.') : '기존 기록 · 날짜 미상'}</p>{canManageMapVisit(v, currentUserId, sharedMode) && <Button type="button" variant="ghost" className="map-text-button" aria-label={`${v.date || '날짜 미상'} 방문 기록 수정`} onClick={() => onVisit(v)}>수정</Button>}</div>
          <p className="text-sm font-medium leading-6"><VisitSummary visit={v}/></p>
          {visitNote(v) && <p className="map-visit-note">{visitNote(v)}</p>}
        </li>)}</ul> : <p className="map-muted py-5 text-sm">다녀온 뒤 첫 방문을 남겨주세요.</p>}
      </section>
      {getOtherMemberMemories(restaurant, currentUserId).length > 0 && <section className="border-t border-[var(--map-rule)] pt-5">
        <h3 className="text-base font-semibold">다른 멤버의 기록</h3>
        <ul className="mt-3 divide-y divide-[var(--map-rule)]">{getOtherMemberMemories(restaurant, currentUserId).map(contributor => <li key={contributor.id} className="space-y-2 py-4">
          <p className="font-semibold">{contributor.nickname}</p>
          <p className="whitespace-pre-wrap break-words text-sm leading-6">{contributor.memory || '남긴 기억이 없어요.'}</p>
          {!!contributor.tags.length && <p className="map-muted text-xs">{contributor.tags.join(' · ')}</p>}
          {!!contributor.visits.length && <ul className="space-y-2 border-l-2 border-[var(--map-sage)] pl-3">{getVisits({ ...restaurant, visits: contributor.visits }).map(contributorVisit => <li key={contributorVisit.id} className="text-sm leading-6"><p className="map-muted">{contributorVisit.date ? contributorVisit.date.replaceAll('-', '.') : '날짜 미상'} · {contributor.nickname}</p><VisitSummary visit={contributorVisit}/>{visitNote(contributorVisit) && <p className="mt-1 whitespace-pre-wrap">{visitNote(contributorVisit)}</p>}</li>)}</ul>}
        </li>)}</ul>
      </section>}
    </div>
    <div className="map-footer"><Button type="button" className="map-primary" onClick={() => onVisit()}>{latest ? '방문 기록 추가' : '다녀왔어요 · 첫 방문 기록'}</Button></div>
  </div>;
}
