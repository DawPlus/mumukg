import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus-visible:bg-[#f7f5ef] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${className}`} {...props} />;
}
