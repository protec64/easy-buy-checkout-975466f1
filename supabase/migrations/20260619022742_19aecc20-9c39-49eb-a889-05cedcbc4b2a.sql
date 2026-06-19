INSERT INTO public.products (id, name, description, price, original_price, active) VALUES
('804a87c3-c43e-4173-b71c-069d83911bc8', 'Taxa de envio - Limite aprovado R$11.700', 'Taxa de envio do cartão', 27.97, 27.97, true),
('31ccbc66-dff2-4273-a3f1-d6e7858a2578', 'Taxa de envio - Limite aprovado R$11.700', 'Taxa de envio do cartão', 29.58, 29.58, true),
('4e1e0583-f0c9-47e9-8632-2e5c81a43518', 'Taxa de envio - Limite aprovado R$11.700', 'Taxa de envio do cartão', 34.90, 34.90, true),
('01ba9522-2107-4a64-9e39-53e782886996', 'Ativar Conta', 'Taxa de ativação da conta', 35.00, 35.00, true),
('3992d6d7-f608-4b8a-9191-c053eda9a673', 'Taxa IOF', 'Imposto sobre Operações Financeiras', 27.00, 27.00, true),
('806f969c-7667-4d9d-8520-18579f3c772b', 'Taxa Anual', 'Anuidade do cartão', 24.90, 24.90, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  active = true,
  updated_at = now();