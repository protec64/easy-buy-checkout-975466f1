/**
 * Checkout API Placeholders
 * Substitua estas funções pelas chamadas reais à API do Mercado Pago
 * via seu backend (Edge Functions / API Routes).
 */
import { supabase } from "@/integrations/supabase/client";

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
  tracking?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    src?: string;
    sck?: string;
    fbclid?: string;
    fbp?: string;
    fbc?: string;
  };
}

export interface PixPaymentResult {
  payment_id: string;
  qr_code_base64: string;
  copia_e_cola: string;
  expires_at: string;
  status: string;
  event_id?: string;
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
  const { data, error } = await supabase.functions.invoke("create-pix", {
    body: payload,
  });

  if (error) {
    throw new Error("Erro ao criar pagamento PIX: " + error.message);
  }

  if (data?.error) {
    throw new Error("Erro na API de pagamento: " + data.error);
  }

  return {
    payment_id: data.payment_id,
    qr_code_base64: data.qr_code_base64 || "",
    copia_e_cola: data.copia_e_cola || "",
    expires_at: data.expires_at,
    status: data.status || "pending",
    event_id: data.event_id || undefined,
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
  meta: { payment_id: string; email: string; cpf: string; order_id?: string; note?: string }
): Promise<UploadResult> {
  // Upload file to storage
  const filePath = `${meta.payment_id}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(filePath, file);

  if (uploadError) {
    throw new Error("Erro ao fazer upload do arquivo: " + uploadError.message);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("payment-proofs")
    .getPublicUrl(filePath);

  const fileUrl = urlData.publicUrl;

  // Save record in payment_proofs table
  const { error: dbError } = await supabase.from("payment_proofs").insert({
    order_id: meta.order_id || null,
    payment_id: meta.payment_id,
    email: meta.email,
    cpf: meta.cpf,
    file_url: fileUrl,
    file_name: file.name,
    note: meta.note || null,
  });

  if (dbError) {
    throw new Error("Erro ao salvar comprovante: " + dbError.message);
  }

  // Dispara UTMify "paid" e marca pedido como aprovado
  try {
    await supabase.functions.invoke("approve-by-proof", {
      body: { payment_id: meta.payment_id },
    });
  } catch (e) {
    console.warn("approve-by-proof invoke failed", e);
  }

  return { file_url: fileUrl };
}

/**
 * Verifica o status do pagamento.
 * TODO: Implementar polling real ou webhook.
 */
export async function checkPaymentStatus(
  payment_id: string
): Promise<{ status: string }> {
  // Consulta o status real na FreePay via edge function (dispara aprovação automática)
  try {
    const { data, error } = await supabase.functions.invoke("check-payment", {
      body: { payment_id },
    });
    if (!error && data?.status && data.status !== "pending") {
      return { status: data.status };
    }
  } catch {}

  // Fallback: status salvo no banco
  const { data, error } = await supabase
    .from("orders")
    .select("payment_status")
    .eq("mp_payment_id", payment_id)
    .single();

  if (error || !data) {
    return { status: "pending" };
  }

  return { status: data.payment_status };
}
