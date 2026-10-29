'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from 'cn';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

type DepthDrawerProps = {
  open: boolean;
  depth: number;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function DepthDrawer({ open, depth, onClose, children, className }: DepthDrawerProps) {
  const level = Math.max(1, Math.min(depth || 1, 3));
  const direction = level === 1 ? 'bottom' : level === 2 ? 'right' : 'left';
  const entrance = level === 1
    ? 'slide-in-from-bottom'
    : level === 2
      ? 'slide-in-from-right'
      : 'slide-in-from-left';

  // Vaul can leave a closed portal in the DOM; unmount after the exit animation
  // so a ghost form cannot sit over the page or steal the next tap.
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(open), open ? 0 : 320); 
    return () => window.clearTimeout(id);
  }, [open]);

  if (!open && !mounted) return null;

  return (
    <Drawer
      open={open}
      direction={direction}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DrawerContent
        aria-hidden={!open}
        className={cn(
          '!inset-0 !m-0 !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !rounded-none !border-0 !bg-[#f7f5ef]',
          'sm:!inset-4 sm:!m-auto sm:!h-[calc(100dvh-2rem)] sm:!max-h-none sm:!w-[min(72vw,800px)] sm:!max-w-[800px] sm:!rounded-2xl sm:!border sm:!border-[#d9d8b8]',
          '[&>div:first-child]:!hidden',
          !open && '!pointer-events-none !invisible',
          className,
        )}
      >
        {open ? (
          <div
            key={level}
            className={cn(
              'flex h-full min-h-0 flex-col animate-in duration-300 ease-out motion-reduce:animate-none',
              entrance,
            )}
          >
            {children}
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
