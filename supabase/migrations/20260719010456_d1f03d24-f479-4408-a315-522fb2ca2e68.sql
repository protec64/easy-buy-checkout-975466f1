GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.payment_attempts TO service_role;
GRANT ALL ON public.payment_proofs TO service_role;
GRANT ALL ON public.products TO service_role;

NOTIFY pgrst, 'reload schema';