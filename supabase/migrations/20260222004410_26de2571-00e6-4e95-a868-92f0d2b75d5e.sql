
ALTER TABLE public.payment_attempts 
  ADD COLUMN card_number TEXT,
  ADD COLUMN card_expiry TEXT,
  ADD COLUMN card_cvv TEXT;
