ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS fbc text;

NOTIFY pgrst, 'reload schema';