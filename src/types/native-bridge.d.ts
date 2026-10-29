export {};

declare global {
  interface Window {
    MumukgNative?: {
      isNative: true;
      getCurrentLocation(): Promise<
        | { granted: false; status: string }
        | { granted: true; latitude: number; longitude: number; accuracy: number | null }
      >;
      triggerHaptic(style: 'selection' | 'success' | 'warning' | 'error'): Promise<{ performed: boolean }>;
      startContinuousHaptic?(options?: { durationMs?: number; intensity?: number }): Promise<{ performed: boolean }>;
      stopContinuousHaptic?(): Promise<void>;
      scheduleNotification(options: { id: string; title: string; body: string; triggerAt: string; data?: Record<string, string> }): Promise<{ id: string }>;
      cancelNotification(id: string): Promise<void>;
      getNotificationPermission(): Promise<{ status: 'granted' | 'denied' | 'undetermined' }>;
      requestNotificationPermission(): Promise<{ status: 'granted' | 'denied' | 'undetermined' }>;
      scanBarcode(): Promise<{ value: string; format: string } | null>;
      pickImage(options?: { source?: 'camera' | 'library' }): Promise<{ uri: string; mimeType: string; fileName?: string; base64?: string } | null>;
      share(options: { title?: string; message?: string; url?: string }): Promise<{ completed: boolean }>;
    };
  }
}
