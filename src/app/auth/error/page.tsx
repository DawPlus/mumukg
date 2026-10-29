import Link from 'next/link';
import { safeRedirectPath } from '@/lib/supabase/redirect';

const messages: Record<string, string> = {
  otp_expired: '인증 링크가 만료됐어. 로그인 화면에서 새 링크를 받아 줘.',
  invalid_link: '인증 링크가 만료됐거나 올바르지 않아. 새 링크를 받아 줘.',
};

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next, '/');
  const message = messages[params.reason ?? ''] ?? messages.invalid_link;

  return <main className="mx-auto max-w-xl px-5 py-10 text-[#4D5B3C]">
    <section className="rounded-3xl border border-[#D9D8B8] bg-[#f7f5ef] p-6">
      <h1 className="text-xl font-bold">로그인할 수 없어</h1>
      <p className="mt-2 text-sm">{message} 돌아간 뒤 상단 로그인 버튼에서 새 링크를 요청해 줘.</p>
      <Link href={next} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#4D5B3C] px-4 font-bold text-[#EFE6D4]">돌아가기</Link>
    </section>
  </main>;
}
