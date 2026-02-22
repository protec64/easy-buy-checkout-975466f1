
DROP POLICY "Allow select payment_attempts" ON public.payment_attempts;

CREATE POLICY "Deny public select on payment_attempts"
  ON public.payment_attempts FOR SELECT
  USING (false);
