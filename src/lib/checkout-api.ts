/**
 * Checkout API Placeholders
 * Substitua estas funções pelas chamadas reais à API do Mercado Pago
 * via seu backend (Edge Functions / API Routes).
 */

export interface Customer {
  email: string;
  full_name: string;
  cpf: string;
  phone?: string;
}

export interface ShippingAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  image?: string;
  variation?: string;
}

export interface OrderPayload {
  customer: Customer;
  shipping_address: ShippingAddress;
  order: {
    items: OrderItem[];
    shipping_cost: number;
    discount: number;
    total: number;
  };
  payment: {
    method: "pix" | "card";
    installments?: number;
    token?: string;
  };
}

export interface PixPaymentResult {
  payment_id: string;
  qr_code_base64: string;
  copia_e_cola: string;
  expires_at: string;
  status: string;
}

export interface CardPaymentResult {
  payment_id: string;
  status: string;
  order_id: string;
}

export interface AddressResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface UploadResult {
  file_url: string;
}

/**
 * Cria um pagamento PIX via Mercado Pago.
 * TODO: Conectar ao endpoint real do seu backend.
 */
export async function createPixPayment(payload: OrderPayload): Promise<PixPaymentResult> {
  // Simula latência de rede
  await new Promise((r) => setTimeout(r, 2000));

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  return {
    payment_id: "PIX_" + Math.random().toString(36).slice(2, 10).toUpperCase(),
    qr_code_base64: "", // Substitua pelo base64 real do QR Code
    copia_e_cola:
      "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540510.005802BR5925LOJA EXEMPLO6009SAO PAULO62070503***6304ABCD",
    expires_at: expiresAt,
    status: "pending",
  };
}

/**
 * Cria pagamento com cartão de crédito via Mercado Pago.
 * TODO: Integrar tokenização e criação de pagamento real.
 */
export async function createCardPayment(payload: OrderPayload): Promise<CardPaymentResult> {
  await new Promise((r) => setTimeout(r, 2500));

  return {
    payment_id: "CARD_" + Math.random().toString(36).slice(2, 10).toUpperCase(),
    status: "approved",
    order_id: "ORD_" + Math.random().toString(36).slice(2, 10).toUpperCase(),
  };
}

/**
 * Busca endereço a partir do CEP usando ViaCEP.
 */
export async function fetchAddressByCep(cep: string): Promise<AddressResult | null> {
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  } catch {
    return null;
  }
}

/**
 * Upload de comprovante de pagamento.
 * TODO: Integrar com storage real (Supabase Storage, S3, etc.).
 */
export async function uploadPaymentProof(
  file: File,
  meta: { payment_id: string; email: string; cpf: string; order_id?: string }
): Promise<UploadResult> {
  await new Promise((r) => setTimeout(r, 1500));

  console.log("Upload proof:", { fileName: file.name, size: file.size, ...meta });

  return {
    file_url: `https://storage.example.com/proofs/${meta.payment_id}/${file.name}`,
  };
}

/**
 * Verifica o status do pagamento.
 * TODO: Implementar polling real ou webhook.
 */
export async function checkPaymentStatus(
  payment_id: string
): Promise<{ status: string }> {
  await new Promise((r) => setTimeout(r, 1000));
  return { status: "pending" };
}
