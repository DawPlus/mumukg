'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseConfig, supabasePublishableKey, supabaseUrl } from './config';

let browserClient: SupabaseClient | null = null;

export function createClient() {
  if (!hasSupabaseConfig || !supabaseUrl || !supabasePublishableKey) return null;
  browserClient ??= createBrowserClient(supabaseUrl, supabasePublishableKey);
  return browserClient;
}
