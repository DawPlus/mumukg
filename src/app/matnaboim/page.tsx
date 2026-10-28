'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Instagram,
  Play,
  Plus,
  Search,
  Trash2,
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
import {
  type TasteLink,
  type TastePlatform,
  extractInstagramCode,
  extractYoutubeId,
  loadTasteLinks,
  saveTasteLinks,
} from '@/lib/taste-links';
import './matnaboim.css';

type FilterType = 'all' | 'youtube' | 'instagram';

export default function MatnaboimPage() {
  const [links, setLinks] = useState<TasteLink[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<TasteLink | null>(null);

  // Form states
  const [inputUrl, setInputUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
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
  const [tagInput, setTagInput] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    setLinks(loadTasteLinks());
  }, []);

  function persist(next: TasteLink[]) {
    setLinks(next);
    saveTasteLinks(next);
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
    } catch {
      toast.add({ title: '링크 정보를 확인하는 중 오류가 발생했습니다.' });
    } finally {
      setLoadingPreview(false);
    }
  }

  // Save new link
  function handleSaveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!previewData) return;

    const tags = tagInput
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean);

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
      tags: tags.length ? tags : undefined,
      createdAt: new Date().toISOString(),
    };

    const next = [newLink, ...links];
    persist(next);

    // Reset form
    setInputUrl('');
    setMemo('');
    setTagInput('');
    setPreviewData(null);
    setIsAddOpen(false);

    toast.add({ title: '맛나보임에 저장했습니다! 🍽️' });
  }

  // Remove link
  function confirmDelete(item: TasteLink) {
    if (playingId === item.id) setPlayingId(null);
    const next = links.filter((l) => l.id !== item.id);
    persist(next);
    toast.add({ title: '링크를 삭제했습니다.' });
  }

  // Filtered and searched links
  const visibleLinks = useMemo(() => {
    let result = links;
    if (filter === 'youtube') result = result.filter((l) => l.platform === 'youtube');
    if (filter === 'instagram') result = result.filter((l) => l.platform === 'instagram');

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.memo?.toLowerCase().includes(q) ||
          l.author?.toLowerCase().includes(q) ||
          l.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [links, filter, search]);

  const counts = useMemo(
    () => ({
      all: links.length,
      youtube: links.filter((l) => l.platform === 'youtube').length,
      instagram: links.filter((l) => l.platform === 'instagram').length,
    }),
    [links]
  );

  return (
    <Shell tone="editorial">
      <div className="matnaboim-screen max-w-xl mx-auto space-y-3.5 pb-10">
        {/* Compact Header Bar */}
        <header className="flex items-center justify-between gap-2 pt-1">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold tracking-tight text-[#3f4b32]">맛나보임</h1>
              <span className="rounded-full bg-[#f7f5ef] border border-[#d9d8b8] px-2 py-0.5 text-[10px] font-semibold text-[#4d5b3c]">
                {links.length}
              </span>
            </div>
            <p className="text-[11px] text-[#6f7a5e]">먹고 싶은 릴스 · 유튜브 보관함</p>
          </div>

          <Button
            type="button"
            onClick={() => setIsAddOpen((prev) => !prev)}
            className="!h-8 !min-h-8 !rounded-full !bg-[#4d5b3c] !px-3 text-xs font-medium !text-[#f7f5ef] hover:!bg-[#38432f] flex items-center gap-1 shrink-0 shadow-xs"
          >
            {isAddOpen ? (
              <>
                <X className="size-3.5" /> 닫기
              </>
            ) : (
              <>
                <Plus className="size-3.5" /> 링크 추가
              </>
            )}
          </Button>
        </header>

        {/* Compact Add Link Section */}
        {isAddOpen && (
          <section
            aria-label="링크 추가"
            className="rounded-2xl border border-[#d9d8b8] bg-white p-3.5 shadow-xs space-y-3 animate-in fade-in duration-150"
          >
            <div className="flex gap-1.5">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="유튜브 또는 릴스 링크 붙여넣기"
                className="flex-1 min-h-9 rounded-xl border border-[#d9d8b8] bg-[#fbf9f4] px-3 text-xs text-[#3f4b32] outline-none focus:border-[#4d5b3c] focus:bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchPreview(inputUrl);
                  }
                }}
              />
              <Button
                type="button"
                disabled={loadingPreview || !inputUrl.trim()}
                onClick={() => fetchPreview(inputUrl)}
                className="!h-9 !min-h-9 !rounded-xl !bg-[#66734b] !px-3 text-xs font-medium !text-[#f7f5ef] hover:!bg-[#556340] shrink-0"
              >
                {loadingPreview ? '조회 중…' : '가져오기'}
              </Button>
            </div>

            {/* Preview Box */}
            {previewData && (
              <form onSubmit={handleSaveLink} className="space-y-2.5 pt-2 border-t border-[#e6e1d1]">
                <div className="flex gap-2.5 items-center rounded-xl border border-[#d9d8b8] bg-[#fbf9f4] p-2">
                  {previewData.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewData.thumbnailUrl}
                      alt="미리보기 썸네일"
                      className="h-14 w-20 rounded-lg object-cover shrink-0 border border-[#d9d8b8]"
                    />
                  ) : (
                    <div className="h-14 w-20 rounded-lg bg-[#efe6d4] flex flex-col items-center justify-center shrink-0 text-[#6f7a5e] border border-[#d9d8b8]">
                      {previewData.platform === 'instagram' ? (
                        <Instagram className="size-5 text-[#b05b6f]" />
                      ) : (
                        <Youtube className="size-5 text-[#c73e3a]" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold bg-white border border-[#d9d8b8] text-[#4d5b3c]">
                      {previewData.platform === 'youtube' ? '유튜브' : '릴스'}
                    </span>
                    <input
                      type="text"
                      value={previewData.title}
                      onChange={(e) =>
                        setPreviewData({ ...previewData, title: e.target.value })
                      }
                      className="w-full text-xs font-semibold text-[#3f4b32] bg-transparent border-b border-[#d9d8b8] pb-0.5 outline-none focus:border-[#4d5b3c] truncate"
                      placeholder="영상 제목"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="한 줄 메모 (선택)"
                    maxLength={100}
                    className="min-h-8.5 rounded-lg border border-[#d9d8b8] bg-[#fbf9f4] px-2.5 text-[11px] text-[#3f4b32] outline-none focus:border-[#4d5b3c] focus:bg-white"
                  />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="#성수 #디저트"
                    maxLength={50}
                    className="min-h-8.5 rounded-lg border border-[#d9d8b8] bg-[#fbf9f4] px-2.5 text-[11px] text-[#3f4b32] outline-none focus:border-[#4d5b3c] focus:bg-white"
                  />
                </div>

                <Button
                  type="submit"
                  className="!h-9 !min-h-9 w-full !rounded-xl !bg-[#4d5b3c] text-xs font-semibold !text-[#f7f5ef] hover:!bg-[#38432f]"
                >
                  보관함에 저장하기
                </Button>
              </form>
            )}
          </section>
        )}

        {/* Compact Filter Tabs & Search */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-pressed={filter === 'all'}
                onClick={() => setFilter('all')}
                className="matnaboim-pill-tab"
              >
                전체 <span className="tabular-nums opacity-75">{counts.all}</span>
              </button>
              <button
                type="button"
                aria-pressed={filter === 'youtube'}
                onClick={() => setFilter('youtube')}
                className="matnaboim-pill-tab"
              >
                <Youtube className="size-3 text-red-500" /> 유튜브{' '}
                <span className="tabular-nums opacity-75">{counts.youtube}</span>
              </button>
              <button
                type="button"
                aria-pressed={filter === 'instagram'}
                onClick={() => setFilter('instagram')}
                className="matnaboim-pill-tab"
              >
                <Instagram className="size-3 text-pink-500" /> 릴스{' '}
                <span className="tabular-nums opacity-75">{counts.instagram}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#6f7a5e]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목, 메모, 태그 검색..."
              className="w-full min-h-8.5 rounded-xl border border-[#d9d8b8] bg-white pl-8.5 pr-8 text-xs text-[#3f4b32] outline-none focus:border-[#4d5b3c]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#6f7a5e] hover:text-[#3f4b32]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Mobile 2-Column Responsive Card Grid */}
        {visibleLinks.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3">
            {visibleLinks.map((item) => {
              const isPlaying = playingId === item.id;
              const ytId = item.videoId || extractYoutubeId(item.url);
              const igCode = item.shortcode || extractInstagramCode(item.url);

              return (
                <article key={item.id} className="matnaboim-card group">
                  {/* Media / Video Container */}
                  <div
                    className={`matnaboim-thumb ${
                      item.isShort ? 'aspect-[4/3] sm:aspect-[4/3]' : 'aspect-video'
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
                          <div className="w-full h-full flex flex-col items-center justify-center text-white text-[10px] p-2 text-center">
                            <p>재생 불가</p>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 underline"
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
                          className="absolute top-1.5 right-1.5 z-20 size-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center shadow-md active:scale-90"
                          title="닫기"
                        >
                          <X className="size-3" />
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
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
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
                          <div className="h-full w-full flex flex-col items-center justify-center bg-[#efe6d4] text-[#6f7a5e]">
                            {item.platform === 'instagram' ? (
                              <Instagram className="size-6 text-[#a85065]" />
                            ) : (
                              <Youtube className="size-6 text-[#ba3e39]" />
                            )}
                          </div>
                        )}

                        {/* Top Left Badge */}
                        <div className="absolute top-1.5 left-1.5 z-10">
                          <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold backdrop-blur-md bg-black/60 text-white">
                            {item.platform === 'youtube' ? (
                              <>
                                <Youtube className="size-2.5 text-red-400" /> 유튜브
                              </>
                            ) : (
                              <>
                                <Instagram className="size-2.5 text-pink-400" /> 릴스
                              </>
                            )}
                          </span>
                        </div>

                        {/* Top Right External Link Button */}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-1.5 right-1.5 z-10 size-6 rounded-full backdrop-blur-md bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                          title="새 탭에서 열기"
                        >
                          <ExternalLink className="size-2.5" />
                        </a>

                        {/* Center Compact Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                          <div className="matnaboim-play-btn">
                            <Play className="size-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compact Card Content Details */}
                  <div className="p-2.5 flex flex-col flex-1 justify-between gap-1.5">
                    <div className="space-y-1">
                      <h3
                        onClick={() => setPlayingId(item.id)}
                        className="font-bold text-xs leading-snug text-[#3f4b32] line-clamp-2 hover:text-[#66734b] transition-colors cursor-pointer"
                        title={item.title}
                      >
                        {item.title}
                      </h3>
                      {item.author && (
                        <p className="text-[10px] text-[#6f7a5e] truncate">{item.author}</p>
                      )}
                    </div>

                    {item.memo && (
                      <div className="rounded-md bg-[#fbf9f4] border border-[#e6e1d1] px-1.5 py-1 text-[10px] text-[#4d5b3c] line-clamp-1">
                        💬 {item.memo}
                      </div>
                    )}

                    {/* Tags & Delete Action Footer */}
                    <div className="pt-1.5 border-t border-[#e6e1d1] flex items-center justify-between gap-1">
                      <div className="flex flex-wrap gap-1 min-w-0 overflow-hidden max-h-5">
                        {item.tags?.slice(0, 2).map((t) => (
                          <span key={t} className="matnaboim-tag">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        aria-label="삭제"
                        onClick={() => setDeletingItem(item)}
                        className="size-6 rounded text-[#888876] hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-[#d9d8b8] bg-[#fbf9f4] p-8 text-center space-y-2">
            <span className="text-3xl" aria-hidden="true">
              🍽️
            </span>
            <h3 className="text-sm font-bold text-[#3f4b32]">
              {search ? '검색 결과가 없어요' : '저장된 영상이 없어요'}
            </h3>
            <p className="text-[11px] text-[#6f7a5e]">
              {search
                ? '다른 키워드로 검색해보세요.'
                : '먹어보고 싶은 영상 링크를 등록해보세요!'}
            </p>
            {!search && (
              <Button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="!mt-2 !h-8 !rounded-full !bg-[#4d5b3c] text-xs font-semibold !text-[#f7f5ef] hover:!bg-[#38432f]"
              >
                영상 링크 추가하기
              </Button>
            )}
          </div>
        )}

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog
          open={!!deletingItem}
          onOpenChange={(open) => {
            if (!open) setDeletingItem(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>영상 링크를 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                {deletingItem ? (
                  <>
                    <span className="font-semibold text-[#3f4b32]">
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
              <AlertDialogCancel onClick={() => setDeletingItem(null)}>
                취소
              </AlertDialogCancel>
              <AlertDialogAction
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
