
CREATE TABLE public.payment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  phone TEXT,
  card_last4 TEXT,
  card_name TEXT,
  installments INT DEFAULT 1,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'card',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on payment_attempts"
  ON public.payment_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow select payment_attempts"
  ON public.payment_attempts FOR SELECT
  USING (true);
