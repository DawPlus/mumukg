type ShellProps = {
  children: React.ReactNode;
  tone?: 'default' | 'editorial';
};

export function Shell({ children, tone = 'default' }: ShellProps) {
  return (
    <div className={`min-h-[calc(100dvh-4rem)] pb-[calc(6rem+env(safe-area-inset-bottom))] ${tone === 'editorial' ? 'w-full bg-[#efe6d4]' : 'mx-auto max-w-xl bg-white shadow-sm'}`}>
      <main className={tone === 'editorial' ? 'story-screen w-full px-4 pb-2 pt-6 sm:px-8 lg:px-10' : 'p-5'}>{children}</main>
    </div>
  );
}
