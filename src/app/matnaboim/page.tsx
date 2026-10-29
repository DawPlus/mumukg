'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { motion } from 'motion/react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
  ClipboardPaste,
  Copy,
  Dices,
  Download,
  ExternalLink,
  Instagram,
  MapPinPlus,
  Pencil,
  Play,
  Plus,
  Search,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UtensilsCrossed,
  X,
  Youtube,
} from 'lucide-react';
import { Shell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Restaurant } from '@/lib/types';
import { loadRestaurants, saveRestaurants } from '@/lib/restaurants';
import {
  type TasteLink,
  type TastePlatform,
  detectTasteContentType,
  extractInstagramCode,
  extractYoutubeId,
  getTasteLinksServerSnapshot,
  getTasteLinksSnapshot,
  saveTasteLinks,
  subscribeTasteLinks,
} from '@/lib/taste-links';
import './matnaboim.css';

type FilterType = 'all' | 'youtube' | 'instagram' | 'favorite' | 'visited';
type ContentTypeFilter = 'all' | 'restaurant' | 'recipe';

export default function MatnaboimPage() {
  const links = useSyncExternalStore(
    subscribeTasteLinks,
    getTasteLinksSnapshot,
    getTasteLinksServerSnapshot
  );
  const [filter, setFilter] = useState<FilterType>('all');
  const [contentType, setContentType] = useState<ContentTypeFilter>('all');
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<TasteLink | null>(null);

  // Edit modal state
  const [editingItem, setEditingItem] = useState<TasteLink | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editCategoryType, setEditCategoryType] = useState<'restaurant' | 'recipe'>('restaurant');

  // Random pick modal state & shuffle motion
  const [randomItem, setRandomItem] = useState<TasteLink | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  // File input ref for data import
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for adding link
  const [inputUrl, setInputUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [addCategoryType, setAddCategoryType] = useState<'restaurant' | 'recipe'>('restaurant');
  const [previewData, setPreviewData] = useState<{
    url: string;
    platform: TastePlatform;
    title: string;
    author?: string;
    thumbnailUrl?: string | null;
    isShort?: boolean;
    videoId?: string;
    shortcode?: string;
  } | null>(null);
  const [memo, setMemo] = useState('');

  // Mobile haptic feedback helper
  function triggerHaptic(duration: number | number[] = 15) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // ignore haptic error
      }
    }
  }

  function persist(next: TasteLink[]) {
    saveTasteLinks(next);
  }

  // Backup data export
  function handleExportData() {
    triggerHaptic(20);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(links, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('download', `mumukg-matnaboim-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.add({ title: '맛나보임 보관함 백업 파일이 저장되었습니다 💾' });
  }

  // Backup data import
  function handleImportData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(links.map((l) => [l.id, l]));
          parsed.forEach((item: TasteLink) => {
            if (item.id && item.url) {
              existingMap.set(item.id, item);
            }
          });
          const merged = Array.from(existingMap.values());
          persist(merged);
          triggerHaptic([30, 40, 30]);
          toast.add({ title: `${parsed.length}개 영상을 성공적으로 복원했습니다! 📂` });
        } else {
          toast.add({ title: '올바른 백업 파일 형식이 아닙니다.' });
        }
      } catch {
        toast.add({ title: '파일을 읽는 도중 오류가 발생했습니다.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // Fetch link preview
  async function fetchPreview(urlToFetch: string) {
    const trimmed = urlToFetch.trim();
    if (!trimmed) return;

    setLoadingPreview(true);
    setPreviewData(null);

    try {
      const res = await fetch('/api/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.add({ title: data.error || '영상 정보를 불러오지 못했습니다.' });
        return;
      }

      setPreviewData({
        url: data.url,
        platform: data.platform,
        title: data.title,
        author: data.author,
        thumbnailUrl: data.thumbnailUrl,
        isShort: data.isShort,
        videoId: data.videoId,
        shortcode: data.shortcode,
      });
      setAddCategoryType(
        detectTasteContentType({ title: data.title || '', memo })
      );
    } catch {
      toast.add({ title: '링크 정보를 확인하는 중 오류가 발생했습니다.' });
    } finally {
      setLoadingPreview(false);
    }
  }

  // Quick paste from clipboard (mobile friendly)
  async function handlePasteFromClipboard() {
    try {
      if (!navigator?.clipboard?.readText) {
        toast.add({ title: '클립보드 읽기가 지원되지 않는 환경입니다.' });
        return;
      }
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (!trimmed) {
        toast.add({ title: '클립보드가 비어있습니다.' });
        return;
      }
      setInputUrl(trimmed);
      toast.add({ title: '클립보드 링크를 붙여넣었습니다 📋' });
      fetchPreview(trimmed);
    } catch {
      toast.add({ title: '클립보드 읽기 권한을 확인해주세요.' });
    }
  }

  // Save new link
  function handleSaveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!previewData) return;

    const newLink: TasteLink = {
      id: `taste-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: previewData.url,
      platform: previewData.platform,
      title: previewData.title || '이름 없는 영상',
      author: previewData.author,
      thumbnailUrl: previewData.thumbnailUrl || undefined,
      isShort: previewData.isShort,
      videoId: previewData.videoId,
      shortcode: previewData.shortcode,
      memo: memo.trim() || undefined,
      createdAt: new Date().toISOString(),
      isFavorite: false,
      isVisited: false,
      categoryType: addCategoryType,
    };

    const next = [newLink, ...links];
    persist(next);

    // Reset form
    setInputUrl('');
    setMemo('');
    setPreviewData(null);
    setAddCategoryType('restaurant');
    setIsAddOpen(false);

    toast.add({ title: '맛나보임에 저장했습니다! 🍽️' });
  }

  // Toggle favorite
  function toggleFavorite(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    triggerHaptic(15);
    const next = links.map((l) => (l.id === id ? { ...l, isFavorite: !l.isFavorite } : l));
    persist(next);
    const target = next.find((l) => l.id === id);
    if (target?.isFavorite) {
      toast.add({ title: '즐겨찾기에 담았습니다 ⭐' });
    } else {
      toast.add({ title: '즐겨찾기에서 해제했습니다.' });
    }
  }

  // Toggle visited (도장 깨기)
  function toggleVisited(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    triggerHaptic(20);
    const next = links.map((l) => (l.id === id ? { ...l, isVisited: !l.isVisited } : l));
    persist(next);
    const target = next.find((l) => l.id === id);
    if (target?.isVisited) {
      toast.add({ title: '🥢 도장 깨기 완료! 맛있게 드셨나요?' });
    } else {
      toast.add({ title: '방문 도장이 취소되었습니다.' });
    }
  }

  // Save to mumukg Map (/map)
  function saveToMumukgMap(item: TasteLink, e?: React.MouseEvent) {
    e?.stopPropagation();
    triggerHaptic(20);
    try {
      const existing = loadRestaurants();
      const alreadySaved = existing.some(
        (r) => r.name === item.title || (r.placeUrl && r.placeUrl === item.url)
      );

      if (alreadySaved) {
        toast.add({ title: '이미 내 지도(/map)에 저장된 맛집입니다! 📍' });
        return;
      }

      const isRecipe = detectTasteContentType(item) === 'recipe';
      const newRestaurant: Restaurant = {
        id: `rest-matnaboim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: item.title,
        category: isRecipe ? '기타' : '한식',
        latitude: 37.5665,
        longitude: 126.978,
        note: item.memo
          ? `${item.memo} (맛나보임 영상: ${item.url})`
          : `맛나보임 보관 영상: ${item.url}`,
        visited: Boolean(item.isVisited),
        createdAt: new Date().toISOString(),
        placeUrl: item.url,
      };

      saveRestaurants([newRestaurant, ...existing]);
      toast.add({ title: '내 지도(/map) 보관함에 핀을 꽂았습니다! 📍' });
    } catch {
      toast.add({ title: '지도 저장 중 오류가 발생했습니다.' });
    }
  }

  // Share to friends (mobile native share or clipboard fallback)
  async function shareLink(item: TasteLink, e?: React.MouseEvent) {
    e?.stopPropagation();
    triggerHaptic(15);
    const isRecipe = detectTasteContentType(item) === 'recipe';
    const tagLabel = isRecipe ? '🍳 집밥 레시피' : '📍 맛집 탐방';
    const shareText = `[맛나보임 ${tagLabel}] ${item.title}${item.memo ? `\n메모: ${item.memo}` : ''}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: item.title,
          text: shareText,
          url: item.url,
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${item.url}`);
      toast.add({ title: '영상 공유 텍스트와 링크를 복사했습니다 📲' });
    } catch {
      toast.add({ title: '공유하기에 실패했습니다.' });
    }
  }

  // Copy link
  async function copyLink(url: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    triggerHaptic(15);
    try {
      await navigator.clipboard.writeText(url);
      toast.add({ title: '영상 링크를 복사했습니다 📋' });
    } catch {
      toast.add({ title: '링크 복사에 실패했습니다.' });
    }
  }

  // Search on Kakao Map
  function searchOnMap(item: TasteLink, e?: React.MouseEvent) {
    e?.stopPropagation();
    const clean = item.title.replace(/[|\[\]()]/g, ' ').trim();
    const query = clean.split(/\s+/).slice(0, 3).join(' ') || item.title;
    window.open(
      `https://map.kakao.com/link/search/${encodeURIComponent(query)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  // Edit link
  function openEdit(item: TasteLink) {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditMemo(item.memo || '');
    setEditCategoryType(detectTasteContentType(item));
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    const next = links.map((l) =>
      l.id === editingItem.id
        ? {
            ...l,
            title: editTitle.trim() || l.title,
            memo: editMemo.trim() || undefined,
            categoryType: editCategoryType,
          }
        : l
    );
    persist(next);
    setEditingItem(null);
    toast.add({ title: '영상 정보를 수정했습니다 ✏️' });
  }

  // Remove link
  function confirmDelete(item: TasteLink) {
    if (playingId === item.id) setPlayingId(null);
    const next = links.filter((l) => l.id !== item.id);
    persist(next);
    toast.add({ title: '링크를 삭제했습니다.' });
  }

  // Random pick recommendation (with Slot-machine Shuffle Motion)
  function pickRandom() {
    const pool = visibleLinks.length > 0 ? visibleLinks : links;
    if (pool.length === 0) {
      toast.add({ title: '저장된 영상이 없습니다.' });
      return;
    }

    if (pool.length === 1) {
      triggerHaptic(30);
      setRandomItem(pool[0]);
      return;
    }

    triggerHaptic(20);
    setIsShuffling(true);
    setRandomItem(pool[Math.floor(Math.random() * pool.length)]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      triggerHaptic(10);
      const rand = pool[Math.floor(Math.random() * pool.length)];
      setRandomItem(rand);

      if (step >= 7) {
        clearInterval(interval);
        setIsShuffling(false);
        triggerHaptic([30, 40, 50]);
      }
    }, 100);
  }

  // Filtered and searched links
  const q = search.trim().toLowerCase();
  const visibleLinks = links.filter((l) => {
    if (filter === 'youtube' && l.platform !== 'youtube') return false;
    if (filter === 'instagram' && l.platform !== 'instagram') return false;
    if (filter === 'favorite' && !l.isFavorite) return false;
    if (filter === 'visited' && !l.isVisited) return false;
    if (contentType !== 'all' && detectTasteContentType(l) !== contentType) return false;
    if (q) {
      const matchesTitle = l.title.toLowerCase().includes(q);
      const matchesMemo = l.memo?.toLowerCase().includes(q);
      const matchesAuthor = l.author?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesMemo && !matchesAuthor) {
        return false;
      }
    }
    return true;
  });

  const counts = useMemo(
    () => ({
      all: links.length,
      youtube: links.filter((l) => l.platform === 'youtube').length,
      instagram: links.filter((l) => l.platform === 'instagram').length,
      favorite: links.filter((l) => !!l.isFavorite).length,
      visited: links.filter((l) => !!l.isVisited).length,
      restaurant: links.filter((l) => detectTasteContentType(l) === 'restaurant').length,
      recipe: links.filter((l) => detectTasteContentType(l) === 'recipe').length,
    }),
    [links]
  );

  const categoryTabs: {
    id: FilterType;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    { id: 'all', label: '전체', icon: null, count: counts.all },
    {
      id: 'youtube',
      label: '유튜브',
      icon: <Youtube className="size-3 text-red-500 shrink-0" />,
      count: counts.youtube,
    },
    {
      id: 'instagram',
      label: '릴스',
      icon: <Instagram className="size-3 text-pink-500 shrink-0" />,
      count: counts.instagram,
    },
    {
      id: 'favorite',
      label: '보관',
      icon: <Star className="size-3 text-[#a47536] fill-[#a47536] shrink-0" />,
      count: counts.favorite,
    },
    {
      id: 'visited',
      label: '가봄',
      icon: <UtensilsCrossed className="size-3 text-[#4d5b3c] shrink-0" />,
      count: counts.visited,
    },
  ];

  // Responsive Column Count (Mobile: 1 column feed, Tablet: 2 columns, Desktop: 3 columns Masonry grid)
  const [colCount, setColCount] = useState(1);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w >= 1024) {
        setColCount(3);
      } else if (w >= 640) {
        setColCount(2);
      } else {
        setColCount(1);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // TanStack Virtualizer for high-performance mobile scrolling
  const listRef = useRef<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    if (listRef.current) {
      setScrollMargin(listRef.current.offsetTop);
    }
  }, [isAddOpen, filter, contentType, search, colCount]);

  const rowCount = Math.ceil(visibleLinks.length / colCount);

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 400,
    overscan: 2,
    scrollMargin,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rowVirtualizer, playingId, visibleLinks.length, isAddOpen, filter, contentType, colCount]);

  return (
    <Shell tone="editorial">
      <div className="matnaboim-screen max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto space-y-4 pb-28 px-1 sm:px-3">
        {/* Compact Mobile Header Bar */}
        <header className="flex items-center justify-between gap-2 pt-0.5 px-0.5">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-extrabold tracking-tight text-[#343e29]">맛나보임</h1>
              <span className="rounded-full bg-[#4d5b3c]/10 px-2 py-0.5 text-[10px] font-bold text-[#4d5b3c]">
                {links.length}
              </span>
            </div>
            <p className="text-[11px] text-[#737d64]">먹고 싶은 릴스 · 유튜브 보관함</p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Hidden file input for data import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />

            {links.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="size-8 rounded-full border border-[#4d5b3c]/15 bg-white text-[#5e6d49] hover:bg-[#f6f3eb] flex items-center justify-center shadow-2xs active:scale-95 transition-all"
                  title="보관함 백업 파일 다운로드 (.json)"
                  aria-label="백업 다운로드"
                >
                  <Download className="size-3.5" />
                </button>
                <Button
                  type="button"
                  onClick={pickRandom}
                  variant="outline"
                  className="!h-8 !min-h-8 !rounded-full border border-[#4d5b3c]/15 bg-white !px-2.5 text-xs font-semibold text-[#4d5b3c] hover:bg-[#f6f3eb] flex items-center gap-1 shrink-0 shadow-2xs active:scale-95 transition-all"
                  title="저장된 영상 중 랜덤 추천"
                >
                  <Dices className="size-3.5 text-[#a47536]" />
                  <span>랜덤</span>
                </Button>
              </>
            )}

            {links.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="size-8 rounded-full border border-[#4d5b3c]/15 bg-white text-[#5e6d49] hover:bg-[#f6f3eb] flex items-center justify-center shadow-2xs active:scale-95 transition-all"
                title="백업 파일에서 복원하기 (.json)"
                aria-label="백업 복원"
              >
                <Upload className="size-3.5" />
              </button>
            )}

            <Button
              type="button"
              onClick={() => setIsAddOpen((prev) => !prev)}
              className="!h-8 !min-h-8 !rounded-full !bg-[#4d5b3c] !px-3 text-xs font-semibold !text-[#f7f5ef] hover:!bg-[#38432f] flex items-center gap-1 shrink-0 shadow-xs active:scale-95 transition-all"
            >
              {isAddOpen ? (
                <>
                  <X className="size-3.5" /> 닫기
                </>
              ) : (
                <>
                  <Plus className="size-3.5" /> 추가
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Refined Add Link Section */}
        {isAddOpen && (
          <section
            aria-label="링크 추가"
            className="rounded-2xl border border-[#4d5b3c]/10 bg-white p-3.5 shadow-sm space-y-3 animate-in fade-in duration-150"
          >
            <div className="flex gap-1.5">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="유튜브 또는 릴스 링크 붙여넣기"
                className="flex-1 min-w-0 min-h-10 rounded-xl border border-[#4d5b3c]/12 bg-[#f8f6f0] px-3 text-[14px] text-[#343e29] outline-none placeholder:text-[#9ea690] focus:border-[#4d5b3c] focus:bg-white transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchPreview(inputUrl);
                  }
                }}
              />
              <Button
                type="button"
                onClick={handlePasteFromClipboard}
                variant="outline"
                className="!h-10 !min-h-10 !rounded-xl border border-[#4d5b3c]/15 bg-white !px-2.5 text-xs font-medium text-[#4d5b3c] hover:bg-[#f6f3eb] flex items-center gap-1 shrink-0 active:scale-95 shadow-2xs"
                title="클립보드에서 바로 붙여넣기"
              >
                <ClipboardPaste className="size-3.5" />
                <span className="hidden xs:inline">붙여넣기</span>
              </Button>
              <Button
                type="button"
                disabled={loadingPreview || !inputUrl.trim()}
                onClick={() => fetchPreview(inputUrl)}
                className="!h-10 !min-h-10 !rounded-xl !bg-[#4d5b3c] !px-3 text-xs font-semibold !text-[#f7f5ef] hover:!bg-[#3c472f] shrink-0 active:scale-95 shadow-xs"
              >
                {loadingPreview ? '조회 중…' : '가져오기'}
              </Button>
            </div>

            {/* Preview Box */}
            {previewData && (
              <form onSubmit={handleSaveLink} className="space-y-2.5 pt-2 border-t border-[#4d5b3c]/[0.08]">
                <div className="flex gap-2.5 items-center rounded-xl border border-[#4d5b3c]/[0.08] bg-[#f8f6f0] p-2">
                  {previewData.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewData.thumbnailUrl}
                      alt="미리보기 썸네일"
                      className="h-14 w-20 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-20 rounded-lg bg-[#eee8db] flex flex-col items-center justify-center shrink-0 text-[#737d64]">
                      {previewData.platform === 'instagram' ? (
                        <Instagram className="size-5 text-[#b05b6f]" />
                      ) : (
                        <Youtube className="size-5 text-[#c73e3a]" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-white border border-[#4d5b3c]/10 text-[#4d5b3c]">
                      {previewData.platform === 'youtube' ? '유튜브' : '릴스'}
                    </span>
                    <input
                      type="text"
                      value={previewData.title}
                      onChange={(e) =>
                        setPreviewData({ ...previewData, title: e.target.value })
                      }
                      className="w-full text-xs font-semibold text-[#343e29] bg-transparent border-b border-[#4d5b3c]/15 pb-0.5 outline-none focus:border-[#4d5b3c] truncate"
                      placeholder="영상 제목"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#737d64] shrink-0">분류:</span>
                  <div className="grid grid-cols-2 gap-1.5 flex-1">
                    <button
                      type="button"
                      onClick={() => setAddCategoryType('restaurant')}
                      className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        addCategoryType === 'restaurant'
                          ? 'bg-[#4d5b3c] text-white shadow-2xs'
                          : 'bg-[#f4f0e6] text-[#6d775f] hover:bg-[#eadecb]'
                      }`}
                    >
                      <span>📍 맛집 외식</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddCategoryType('recipe')}
                      className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        addCategoryType === 'recipe'
                          ? 'bg-[#a47536] text-white shadow-2xs'
                          : 'bg-[#f4f0e6] text-[#6d775f] hover:bg-[#eadecb]'
                      }`}
                    >
                      <span>🍳 집밥 레시피</span>
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="한 줄 메모 (선택, 예: 웨이팅 꿀팁, 추천 메뉴)"
                    maxLength={100}
                    className="w-full min-h-10 rounded-xl border border-[#4d5b3c]/12 bg-[#f8f6f0] px-3 text-[14px] text-[#343e29] outline-none placeholder:text-[#9ea690] focus:border-[#4d5b3c] focus:bg-white"
                  />
                </div>

                <Button
                  type="submit"
                  className="!h-10 !min-h-10 w-full !rounded-xl !bg-[#4d5b3c] text-xs font-semibold !text-[#f7f5ef] hover:!bg-[#38432f] active:scale-98 shadow-xs"
                >
                  보관함에 저장하기
                </Button>
              </form>
            )}
          </section>
        )}

        {/* Refined Pill Segmented Tabs & Search Bar */}
        <div className="space-y-2">
          {/* Floating Pill Dock */}
          <div
            role="tablist"
            aria-label="카테고리 필터"
            className="relative grid grid-cols-5 gap-0.5 p-1 rounded-full bg-[#eee9df] border border-[#4d5b3c]/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
          >
            {categoryTabs.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(tab.id)}
                  whileTap={{ scale: 0.94 }}
                  className={`relative z-10 flex items-center justify-center gap-1 py-1.5 px-0.5 text-[10.5px] font-semibold transition-colors duration-200 select-none rounded-full ${
                    isActive ? 'text-[#f7f5ef]' : 'text-[#6d775f] hover:text-[#343e29]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="category-active-pill"
                      className="absolute inset-0 z-[-1] rounded-full bg-[#4d5b3c] shadow-[0_2px_8px_rgba(77,91,60,0.24)]"
                      transition={{
                        type: 'spring',
                        stiffness: 480,
                        damping: 34,
                      }}
                    />
                  )}
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className={`tabular-nums text-[9.5px] transition-opacity ${
                      isActive ? 'opacity-90 font-bold' : 'opacity-65'
                    }`}
                  >
                    {tab.count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Sub Smart Content Filter (모두 / 📍 외식 맛집 / 🍳 집밥 레시피) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f4f0e6]/80 border border-[#4d5b3c]/[0.08]">
            <button
              type="button"
              onClick={() => setContentType('all')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                contentType === 'all'
                  ? 'bg-white text-[#343e29] shadow-2xs border border-[#4d5b3c]/15'
                  : 'text-[#737d64] hover:text-[#343e29]'
              }`}
            >
              모두보기
            </button>
            <button
              type="button"
              onClick={() => setContentType('restaurant')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                contentType === 'restaurant'
                  ? 'bg-[#4d5b3c] text-white shadow-2xs'
                  : 'text-[#737d64] hover:text-[#343e29]'
              }`}
            >
              <span>📍 맛집</span>
              <span className="text-[10px] opacity-80 tabular-nums">({counts.restaurant})</span>
            </button>
            <button
              type="button"
              onClick={() => setContentType('recipe')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                contentType === 'recipe'
                  ? 'bg-[#a47536] text-white shadow-2xs'
                  : 'text-[#737d64] hover:text-[#343e29]'
              }`}
            >
              <span>🍳 레시피</span>
              <span className="text-[10px] opacity-80 tabular-nums">({counts.recipe})</span>
            </button>
          </div>

          {/* Rounded Pill Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-[#737d64]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="영상 제목, 메모 검색..."
              className="w-full min-h-9.5 rounded-full border border-[#4d5b3c]/12 bg-white pl-9.5 pr-8 text-[14px] text-[#343e29] outline-none placeholder:text-[#9ea690] shadow-2xs focus:border-[#4d5b3c]/40 focus:ring-2 focus:ring-[#4d5b3c]/10 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-[#eee9df] text-[#737d64] hover:text-[#343e29] hover:bg-[#e4ded2] flex items-center justify-center text-[10px] transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Responsive Feed & Masonry Cards (Mobile: 1-col feed, Tablet/Desktop: 2~3 col Masonry grid) */}
        {visibleLinks.length > 0 ? (
          <div
            ref={listRef}
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * colCount;
              const rowItems = visibleLinks.slice(startIndex, startIndex + colCount);

              return (
                <div
                  key={virtualRow.key}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  className="absolute top-0 left-0 w-full pb-3.5"
                  style={{
                    transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                  }}
                >
                  <div
                    className={`grid gap-3.5 ${
                      colCount === 3
                        ? 'grid-cols-3'
                        : colCount === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-1'
                    }`}
                  >
                    {rowItems.map((item) => {
                      const isPlaying = playingId === item.id;
                      const ytId = item.videoId || extractYoutubeId(item.url);
                      const igCode = item.shortcode || extractInstagramCode(item.url);

                      return (
                        <article key={item.id} className="matnaboim-card group">
                          {/* Media / Video Container */}
                          <div
                            className={`matnaboim-thumb ${
                              item.isShort ? 'aspect-[4/3]' : 'aspect-video'
                            }`}
                          >
                            {isPlaying ? (
                              /* Inline Video Player */
                              <div className="relative w-full h-full bg-black">
                                {item.platform === 'youtube' && ytId ? (
                                  <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&playsinline=1`}
                                    title={item.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="w-full h-full border-0"
                                  />
                                ) : item.platform === 'instagram' && igCode ? (
                                  <iframe
                                    src={`https://www.instagram.com/reel/${igCode}/embed`}
                                    title={item.title}
                                    allowTransparency
                                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                                    className="w-full h-full border-0 bg-white"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-white text-xs p-3 text-center">
                                    <p>재생 불가</p>
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-1.5 underline text-sm"
                                    >
                                      새 탭 열기
                                    </a>
                                  </div>
                                )}

                                {/* Close Player Button */}
                                <button
                                  type="button"
                                  onClick={() => setPlayingId(null)}
                                  aria-label="재생 닫기"
                                  className="absolute top-2.5 right-2.5 z-30 size-8.5 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center shadow-lg active:scale-90"
                                  title="닫기"
                                >
                                  <X className="size-4" />
                                </button>
                              </div>
                            ) : (
                              /* Thumbnail View with Play Button */
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setPlayingId(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setPlayingId(item.id);
                                  }
                                }}
                                className="matnaboim-thumb-overlay relative w-full h-full cursor-pointer select-none"
                              >
                                {item.thumbnailUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.thumbnailUrl}
                                    alt={item.title}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement?.classList.add(
                                        'flex',
                                        'items-center',
                                        'justify-center',
                                        'bg-[#efe6d4]'
                                      );
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full flex flex-col items-center justify-center bg-[#eee8db] text-[#737d64]">
                                    {item.platform === 'instagram' ? (
                                      <Instagram className="size-8 text-[#a85065]" />
                                    ) : (
                                      <Youtube className="size-8 text-[#ba3e39]" />
                                    )}
                                  </div>
                                )}

                                {/* Top Left Badges (Platform & Smart Recipe/Restaurant Badge) */}
                                <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap max-w-[70%]">
                                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold backdrop-blur-md bg-black/45 text-white shadow-2xs">
                                    {item.platform === 'youtube' ? (
                                      <>
                                        <Youtube className="size-3 text-red-400" /> 유튜브
                                      </>
                                    ) : (
                                      <>
                                        <Instagram className="size-3 text-pink-400" /> 릴스
                                      </>
                                    )}
                                  </span>
                                  {detectTasteContentType(item) === 'recipe' ? (
                                    <span className="matnaboim-smart-badge recipe shadow-2xs">
                                      🍳 레시피
                                    </span>
                                  ) : (
                                    <span className="matnaboim-smart-badge restaurant shadow-2xs">
                                      📍 맛집
                                    </span>
                                  )}
                                </div>

                                {/* Top Right Actions (Stamp & Favorite) */}
                                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    aria-label={item.isVisited ? '방문 도장 취소' : '가봤어요 도장 찍기'}
                                    onClick={(e) => toggleVisited(item.id, e)}
                                    className={`px-2 py-1 rounded-full backdrop-blur-md flex items-center gap-1 text-[11px] font-bold transition-all active:scale-90 ${
                                      item.isVisited
                                        ? 'bg-[#4d5b3c] text-white shadow-xs'
                                        : 'bg-black/40 text-white/95 hover:bg-black/70'
                                    }`}
                                    title={item.isVisited ? '방문 완료!' : '도장 찍기'}
                                  >
                                    <UtensilsCrossed className="size-3" />
                                    <span>{item.isVisited ? '가봤어요!' : '도장'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                                    onClick={(e) => toggleFavorite(item.id, e)}
                                    className={`size-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors active:scale-90 ${
                                      item.isFavorite
                                        ? 'bg-[#a47536] text-white shadow-xs'
                                        : 'bg-black/40 text-white/95 hover:bg-black/70'
                                    }`}
                                    title={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                                  >
                                    <Star
                                      className={`size-3.5 ${item.isFavorite ? 'fill-current' : ''}`}
                                    />
                                  </button>
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="size-8 rounded-full backdrop-blur-md bg-black/40 text-white flex items-center justify-center hover:bg-black/70 transition-colors active:scale-90"
                                    title="새 탭에서 열기"
                                  >
                                    <ExternalLink className="size-3" />
                                  </a>
                                </div>

                                {/* Center Large Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                  <div className="matnaboim-play-btn !size-12">
                                    <Play className="size-5 fill-current ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Card Content Details */}
                          <div className="p-3.5 flex flex-col justify-between gap-2.5">
                            <div className="space-y-1">
                              <h3
                                onClick={() => setPlayingId(item.id)}
                                className="font-bold text-[14.5px] leading-snug text-[#2e3724] line-clamp-2 hover:text-[#52643f] transition-colors cursor-pointer"
                                title={item.title}
                              >
                                {item.title}
                              </h3>
                              {item.author && (
                                <p className="text-[11px] text-[#7b856e] font-medium">
                                  {item.author}
                                </p>
                              )}
                            </div>

                            {item.memo && (
                              <div className="rounded-xl bg-[#f5f1e7] p-2.5 text-xs text-[#4d5b3c] leading-relaxed">
                                💬 {item.memo}
                              </div>
                            )}

                            {/* Footer Utility Actions (Clear & Thumb-Friendly) */}
                            <div className="pt-2 border-t border-[#4d5b3c]/[0.07] flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={(e) => saveToMumukgMap(item, e)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#4d5b3c]/10 text-[#4d5b3c] hover:bg-[#4d5b3c]/20 text-xs font-semibold transition-all active:scale-95"
                                  title="내 지도(/map)에 핀 꽂기"
                                >
                                  <MapPinPlus className="size-3.5 text-[#4d5b3c]" />
                                  <span>내 지도 저장</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => shareLink(item, e)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f4f0e6] text-[#4d5b3c] hover:bg-[#eadecb] text-xs font-semibold transition-all active:scale-95"
                                  title="친구에게 공유하기"
                                >
                                  <Share2 className="size-3.5 text-[#5e6d49]" />
                                  <span>공유</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => searchOnMap(item, e)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#f4f0e6] text-[#6d775f] hover:bg-[#eadecb] hover:text-[#343e29] text-xs font-medium transition-all active:scale-95"
                                  title="카카오맵에서 맛집 찾기"
                                >
                                  <ExternalLink className="size-3 text-[#7b856e]" />
                                  <span>카카오맵</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => copyLink(item.url, e)}
                                  className="size-8 rounded-xl text-[#7b846e] hover:bg-[#f0ebe0] hover:text-[#343e29] flex items-center justify-center transition-all active:scale-95"
                                  title="링크 복사"
                                  aria-label="링크 복사"
                                >
                                  <Copy className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEdit(item)}
                                  className="size-8 rounded-xl text-[#7b846e] hover:bg-[#f0ebe0] hover:text-[#343e29] flex items-center justify-center transition-all active:scale-95"
                                  title="영상 정보 수정"
                                  aria-label="영상 정보 수정"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  aria-label="삭제"
                                  onClick={() => setDeletingItem(item)}
                                  className="size-8 rounded-xl text-[#7b846e] hover:bg-[#fdf0ef] hover:text-[#b4534b] flex items-center justify-center transition-all active:scale-95"
                                  title="삭제"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Tailored Empty State */
          <div className="rounded-2xl border border-[#4d5b3c]/10 bg-white/70 backdrop-blur-xs p-8 text-center space-y-2.5 shadow-2xs">
            <span className="text-3xl" aria-hidden="true">
              {filter === 'visited'
                ? '🥢'
                : filter === 'favorite'
                ? '⭐'
                : contentType === 'recipe'
                ? '🍳'
                : '🍽️'}
            </span>
            <h3 className="text-sm font-bold text-[#343e29]">
              {search
                ? '검색 결과가 없어요'
                : filter === 'visited'
                ? '아직 도장 깬 맛집이 없어요'
                : filter === 'favorite'
                ? '보관한 영상이 없어요'
                : contentType === 'recipe'
                ? '집밥 레시피 영상이 없어요'
                : '저장된 영상이 없어요'}
            </h3>
            <p className="text-[11px] text-[#737d64]">
              {search
                ? '다른 키워드로 검색해보세요.'
                : filter === 'visited'
                ? '영상 카드의 [도장] 버튼을 눌러 도장 깨기를 기록해보세요!'
                : filter === 'favorite'
                ? '자주 꺼내보고 싶은 영상의 별표(⭐)를 눌러보세요!'
                : contentType === 'recipe'
                ? '따라 해보고 싶은 레시피 영상 링크를 등록해보세요.'
                : '먹어보고 싶은 맛집 릴스나 유튜브 링크를 등록해보세요!'}
            </p>
            {search || filter !== 'all' || contentType !== 'all' ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                  setContentType('all');
                }}
                className="!mt-2 !h-8 !rounded-full border border-[#4d5b3c]/15 bg-white text-xs font-semibold text-[#4d5b3c] shadow-2xs"
              >
                필터 초기화
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="!mt-2 !h-8 !rounded-full !bg-[#4d5b3c] text-xs font-semibold !text-[#f7f5ef] hover:!bg-[#38432f] shadow-xs"
              >
                영상 링크 추가하기
              </Button>
            )}
          </div>
        )}

        {/* Edit Item Alert Dialog */}
        <AlertDialog
          open={!!editingItem}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null);
          }}
        >
          <AlertDialogContent className="max-w-[340px] sm:max-w-sm rounded-2xl border border-[#4d5b3c]/12 bg-[#faf8f4] shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold text-[#343e29]">
                영상 정보 수정
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-[#737d64]">
                제목과 한 줄 메모를 수정할 수 있어요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form onSubmit={handleSaveEdit} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#4d5b3c]">영상 제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full min-h-10 rounded-xl border border-[#4d5b3c]/12 bg-white px-3 text-[14px] text-[#343e29] outline-none focus:border-[#4d5b3c]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#4d5b3c]">분류</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditCategoryType('restaurant')}
                    className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      editCategoryType === 'restaurant'
                        ? 'bg-[#4d5b3c] text-white shadow-2xs'
                        : 'bg-white border border-[#4d5b3c]/15 text-[#6d775f] hover:bg-[#f4f0e6]'
                    }`}
                  >
                    <span>📍 외식 맛집</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCategoryType('recipe')}
                    className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      editCategoryType === 'recipe'
                        ? 'bg-[#a47536] text-white shadow-2xs'
                        : 'bg-white border border-[#4d5b3c]/15 text-[#6d775f] hover:bg-[#f4f0e6]'
                    }`}
                  >
                    <span>🍳 집밥 레시피</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#4d5b3c]">한 줄 메모</label>
                <input
                  type="text"
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  placeholder="방문 꿀팁, 메뉴 추천 등"
                  maxLength={100}
                  className="w-full min-h-10 rounded-xl border border-[#4d5b3c]/12 bg-white px-3 text-[14px] text-[#343e29] outline-none focus:border-[#4d5b3c]"
                />
              </div>
              <AlertDialogFooter className="pt-2">
                <AlertDialogCancel
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="!min-h-10 rounded-xl border border-[#4d5b3c]/15"
                >
                  취소
                </AlertDialogCancel>
                <Button
                  type="submit"
                  className="!h-10 !min-h-10 !rounded-xl !bg-[#4d5b3c] text-xs font-semibold !text-[#f7f5ef] hover:!bg-[#38432f] shadow-xs"
                >
                  수정 완료
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>

        {/* Random Pick Alert Dialog */}
        <AlertDialog
          open={!!randomItem}
          onOpenChange={(open) => {
            if (!open) setRandomItem(null);
          }}
        >
          <AlertDialogContent
            className="relative max-w-[340px] sm:max-w-sm rounded-2xl border border-[#4d5b3c]/12 bg-[#faf8f4] shadow-xl"
          >
            {/* Top Right Close Button */}
            <button
              type="button"
              onClick={() => setRandomItem(null)}
              className="absolute top-3 right-3 size-7 rounded-full text-[#737d64] hover:bg-[#ece6d9] hover:text-[#343e29] flex items-center justify-center transition-colors active:scale-90"
              title="닫기"
              aria-label="닫기"
            >
              <X className="size-4" />
            </button>

            <AlertDialogHeader className="pr-6">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#a47536]">
                <Sparkles className={`size-4 ${isShuffling ? 'animate-spin' : ''}`} />{' '}
                {isShuffling ? '두구두구… 추천 메뉴 고르는 중!' : '오늘 뭐 먹지? 맛나보임 추천'}
              </div>
              <AlertDialogTitle className="text-base font-bold text-[#343e29] mt-1 text-left min-h-6">
                {isShuffling ? '🎲 추첨 중…' : randomItem?.title}
              </AlertDialogTitle>
              {randomItem?.author && !isShuffling && (
                <AlertDialogDescription className="text-xs text-[#737d64] text-left">
                  출처: {randomItem.author}
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>

            {randomItem && (
              <div className="space-y-2 py-1">
                <div
                  className={`relative aspect-video rounded-xl overflow-hidden bg-black shadow-xs transition-all duration-100 ${
                    isShuffling ? 'scale-[0.97] opacity-70 blur-[1px]' : 'scale-100 opacity-100'
                  }`}
                >
                  {randomItem.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={randomItem.thumbnailUrl}
                      alt={randomItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#eee8db] text-[#4d5b3c]">
                      🍽️
                    </div>
                  )}
                </div>

                {randomItem.memo && !isShuffling && (
                  <div className="rounded-xl bg-[#f5f1e7] p-2 text-xs text-[#4d5b3c] leading-relaxed">
                    💬 {randomItem.memo}
                  </div>
                )}
              </div>
            )}

            <AlertDialogFooter className="grid grid-cols-3 gap-1.5 pt-2">
              <AlertDialogCancel
                onClick={() => setRandomItem(null)}
                className="!h-10 !min-h-10 !rounded-xl border border-[#4d5b3c]/15 text-xs font-semibold text-[#667258] hover:bg-[#eee8db] mt-0"
              >
                닫기
              </AlertDialogCancel>
              <Button
                type="button"
                variant="outline"
                disabled={isShuffling}
                onClick={pickRandom}
                className="!h-10 !min-h-10 !rounded-xl border border-[#4d5b3c]/15 text-xs font-semibold text-[#4d5b3c] hover:bg-[#eee8db]"
              >
                <Dices className={`size-3.5 mr-1 ${isShuffling ? 'animate-spin' : ''}`} /> 다시 뽑기
              </Button>
              <Button
                type="button"
                disabled={isShuffling}
                onClick={() => {
                  if (randomItem) {
                    const targetIndex = visibleLinks.findIndex((l) => l.id === randomItem.id);
                    if (targetIndex >= 0) {
                      rowVirtualizer.scrollToIndex(targetIndex, {
                        align: 'center',
                        behavior: 'smooth',
                      });
                    }
                    setPlayingId(randomItem.id);
                    setRandomItem(null);
                  }
                }}
                className="!h-10 !min-h-10 !rounded-xl !bg-[#4d5b3c] text-xs font-semibold !text-[#f7f5ef] hover:!bg-[#38432f] shadow-xs"
              >
                <Play className="size-3.5 mr-1 fill-current" /> 바로 보기
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog
          open={!!deletingItem}
          onOpenChange={(open) => {
            if (!open) setDeletingItem(null);
          }}
        >
          <AlertDialogContent className="max-w-[340px] sm:max-w-sm rounded-2xl border border-[#4d5b3c]/12 bg-[#faf8f4] shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold text-[#343e29]">
                영상 링크를 삭제할까요?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-[#737d64]">
                {deletingItem ? (
                  <>
                    <span className="font-semibold text-[#343e29]">
                      &apos;{deletingItem.title}&apos;
                    </span>
                    <br />
                    보관함에서 완전히 삭제됩니다.
                  </>
                ) : (
                  '보관함에서 완전히 삭제됩니다.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setDeletingItem(null)}
                className="!min-h-10 rounded-xl border border-[#4d5b3c]/15"
              >
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                className="!min-h-10 !rounded-xl !bg-[#b4534b] hover:!bg-[#993f38] shadow-xs"
                onClick={() => {
                  if (deletingItem) {
                    confirmDelete(deletingItem);
                    setDeletingItem(null);
                  }
                }}
              >
                삭제하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Shell>
  );
}
