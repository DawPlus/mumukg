import { NextResponse } from 'next/server';
import {
  detectPlatform,
  extractInstagramCode,
  extractYoutubeId,
  isYoutubeShorts,
} from '@/lib/taste-links';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '유효한 URL을 입력해주세요.' }, { status: 400 });
    }

    const trimmedUrl = url.trim();
    const platform = detectPlatform(trimmedUrl);

    // 1. YouTube
    if (platform === 'youtube') {
      const videoId = extractYoutubeId(trimmedUrl);
      if (!videoId) {
        return NextResponse.json({ error: '올바른 유튜브 링크 형식이 아닙니다.' }, { status: 400 });
      }

      const isShort = isYoutubeShorts(trimmedUrl);
      const defaultThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      // Try fetching oEmbed for title & author
      let title = isShort ? '유튜브 쇼츠' : '유튜브 영상';
      let author = 'YouTube';

      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
          `https://www.youtube.com/watch?v=s${videoId}`
        )}&format=json`;
        const res = await fetch(oembedUrl, {
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.title) title = data.title;
          if (data.author_name) author = data.author_name;
        }
      } catch {
        // Fallback to defaults
      }

      return NextResponse.json({
        success: true,
        platform: 'youtube',
        videoId,
        title,
        author,
        thumbnailUrl: defaultThumbnail,
        isShort,
        url: trimmedUrl,
      });
    }

    // 2. Instagram
    if (platform === 'instagram') {
      const shortcode = extractInstagramCode(trimmedUrl);
      let title = '인스타그램 릴스';
      let author = 'Instagram';
      let thumbnailUrl: string | null = null;

      try {
        const res = await fetch(trimmedUrl, {
          headers: {
            'User-Agent':
              'facebookexternalhit/1.1 (+https://www.facebook.com/externalhit_uatext.php)',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          const html = await res.text();
          const ogTitleMatch = html.match(
            /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i
          ) || html.match(
            /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i
          );
          const ogImageMatch = html.match(
            /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i
          ) || html.match(
            /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i
          );

          if (ogTitleMatch && ogTitleMatch[1]) {
            title = ogTitleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'");
          }
          if (ogImageMatch && ogImageMatch[1]) {
            thumbnailUrl = ogImageMatch[1].replace(/&amp;/g, '&');
          }
        }
      } catch {
        // Fallback gracefully
      }

      return NextResponse.json({
        success: true,
        platform: 'instagram',
        shortcode,
        title,
        author,
        thumbnailUrl,
        isShort: true,
        url: trimmedUrl,
      });
    }

    // 3. General Web
    try {
      const res = await fetch(trimmedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const html = await res.text();
        const ogTitleMatch = html.match(
          /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i
        ) || html.match(/<title>([^<]*)<\/title>/i);
        const ogImageMatch = html.match(
          /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i
        );
        const ogSiteMatch = html.match(
          /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i
        );

        return NextResponse.json({
          success: true,
          platform: 'web',
          title: ogTitleMatch?.[1] || trimmedUrl,
          author: ogSiteMatch?.[1] || new URL(trimmedUrl).hostname,
          thumbnailUrl: ogImageMatch?.[1] || null,
          isShort: false,
          url: trimmedUrl,
        });
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      platform: 'web',
      title: trimmedUrl,
      author: new URL(trimmedUrl).hostname,
      thumbnailUrl: null,
      isShort: false,
      url: trimmedUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '링크 정보를 가져오는데 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
