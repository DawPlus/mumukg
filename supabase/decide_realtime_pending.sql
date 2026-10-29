-- Pending: run separately when production DB changes are authorized.
-- Enables postgres_changes events for authenticated shared-menu clients.
ALTER PUBLICATION supabase_realtime ADD TABLE public.decide_foods;
-- Keep existing RLS enabled; no blanket grants or broad policies.
