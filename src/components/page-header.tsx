type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

export function PageHeader({ title, description, className = '' }: PageHeaderProps) {
  return (
    <header className={`border-b border-[#e6e1d1] bg-[#f7f5ef] px-5 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] ${className}`}>
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#66734b]">mumukg</p>
          <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-[#3f4b32]">{title}</h1>
          {description && <p className="mt-1 text-sm text-[#747665]">{description}</p>}
        </div>
      </div>
    </header>
  );
}
