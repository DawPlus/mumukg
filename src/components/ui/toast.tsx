'use client';

import { Toast as ToastPrimitive } from '@animate-ui/react/primitives/base-ui/toast';

export const toast = ToastPrimitive.createToastManager();

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();
  return toasts.map((item) => (
    <ToastPrimitive.Root key={item.id} toast={item} className="group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] h-(--height) w-full origin-bottom rounded-xl border border-[#4d5b3c] bg-[#efe6d4] text-sm text-[#4d5b3c] shadow-lg outline-none [--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] data-limited:opacity-0">
      <ToastPrimitive.Content className="flex h-full items-center gap-3 overflow-hidden rounded-xl px-4 py-3 data-behind:opacity-0 data-expanded:opacity-100">
        <ToastPrimitive.Title />
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  ));
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastPrimitive.Provider toastManager={toast} progressBar={false}>
    {children}
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport className="pointer-events-none fixed inset-x-4 bottom-24 z-[100] mx-auto w-auto max-w-sm outline-none">
        <ToastList />
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  </ToastPrimitive.Provider>;
}
