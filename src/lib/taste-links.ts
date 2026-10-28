export type TastePlatform = 'youtube' | 'instagram' | 'web';

export type TasteLink = {
  id: string;
  url: string;
  platform: TastePlatform;
  title: string;
  author?: string;
  thumbnailUrl?: string;
  memo?: string;
  tags?: string[];
  isShort?: boolean;
  videoId?: string;
  shortcode?: string;
  createdAt: string;
};

const STORAGE_KEY = 'mumukg_taste_links_v2';

const INITIAL_SAMPLES: TasteLink[] = [
  {
    id: 'sample-1',
    url: 'https://www.youtube.com/watch?v=0kFhA4HhY_c',
    platform: 'youtube',
    videoId: '0kFhA4HhY_c',
    title: '성시경의 먹을텐데 | 성수동 돼지갈비 골목',
    author: '성시경 SUNG SI KYUNG',
    thumbnailUrl: 'https://img.youtube.com/vi/0kFhA4HhY_c/hqdefault.jpg',
    memo: '고기 때깔 미쳤음... 이번 주말에 꼭 가보기',
    tags: ['성수', '돼지갈비', '성시경'],
    isShort: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'sample-2',
    url: 'https://www.youtube.com/shorts/3Zz9j4B-4l0',
    platform: 'youtube',
    videoId: '3Zz9j4B-4l0',
    title: '치즈 폭포 불닭 볶음밥 레시피 🔥',
    author: '맛있는 한끼',
    thumbnailUrl: 'https://img.youtube.com/vi/3Zz9j4B-4l0/hqdefault.jpg',
    memo: '집에서 야식으로 따라해볼 레시피',
    tags: ['레시피', '불닭', '야식'],
    isShort: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'sample-3',
    url: 'https://www.instagram.com/reel/C_reels_sample/',
    platform: 'instagram',
    shortcode: 'C_reels_sample',
    title: '크림 듬뿍 딸기 수플레 팬케이크 맛집 🥞',
    author: '@foodie_seoul',
    thumbnailUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80',
    memo: '비주얼 대박 디저트 카페',
    tags: ['연남동', '수플레', '디저트'],
    isShort: true,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

export function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function isYoutubeShorts(url: string): boolean {
  return url.includes('/shorts/');
}

export function extractInstagramCode(url: string): string | null {
  const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function detectPlatform(url: string): TastePlatform {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
  return 'web';
}

export function loadTasteLinks(): TasteLink[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLES));
      return INITIAL_SAMPLES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAMPLES;
  } catch {
    return INITIAL_SAMPLES;
  }
}

export function saveTasteLinks(items: TasteLink[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save taste links', e);
  }
}
