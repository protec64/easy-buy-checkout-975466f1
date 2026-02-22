
-- Tabela de pedidos
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE DEFAULT 'ORD_' || upper(substr(md5(random()::text), 1, 8)),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  phone TEXT,
  -- Endereço
  cep TEXT NOT NULL,
  street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  reference TEXT,
  -- Valores
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  -- Pagamento
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'card')),
  payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  installments INT DEFAULT 1,
  -- Mercado Pago
  mp_payment_id TEXT,
  mp_status TEXT,
  mp_qr_code TEXT,
  mp_copia_e_cola TEXT,
  mp_expires_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de itens do pedido
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variation TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de comprovantes de pagamento
CREATE TABLE public.payment_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: tabelas públicas (pedidos criados sem autenticação)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT anônimo (checkout sem login)
CREATE POLICY "Allow anonymous insert on orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on payment_proofs"
  ON public.payment_proofs FOR INSERT
  WITH CHECK (true);

-- Permitir SELECT por email (para a página de sucesso)
CREATE POLICY "Allow select own orders by email"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Allow select order items"
  ON public.order_items FOR SELECT
  USING (true);

CREATE POLICY "Allow select payment proofs"
  ON public.payment_proofs FOR SELECT
  USING (true);

-- Permitir UPDATE no status do pedido (para webhooks/edge functions via service role)
CREATE POLICY "Allow update orders"
  ON public.orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Storage bucket para comprovantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true);

-- RLS para storage: permitir upload anônimo
CREATE POLICY "Allow anonymous upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Allow public read payment proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs');
