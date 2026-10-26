type ShellProps = {
  children: React.ReactNode;
  tone?: 'default' | 'editorial';
};

export function Shell({ children, tone = 'default' }: ShellProps) {
  return (
    <div className={`mx-auto min-h-[calc(100dvh-4rem)] max-w-xl pb-[calc(6rem+env(safe-area-inset-bottom))] ${tone === 'editorial' ? 'bg-[#f7f5ef]' : 'bg-white'} shadow-sm`}>
      <main className={tone === 'editorial' ? 'px-5 pb-2 pt-5' : 'p-5'}>{children}</main>
    </div>
  );
}
