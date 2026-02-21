import { z } from "zod";

function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(cleaned[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(cleaned[10]);
}

export const customerSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email obrigatório"),
  fullName: z
    .string()
    .min(1, "Nome obrigatório")
    .refine((v) => v.trim().split(/\s+/).length >= 2, "Informe nome e sobrenome"),
  cpf: z
    .string()
    .min(14, "CPF incompleto")
    .refine((v) => isValidCPF(v), "CPF inválido"),
  phone: z.string().optional(),
});

export const shippingSchema = z.object({
  cep: z.string().min(9, "CEP incompleto"),
  street: z.string().min(1, "Rua obrigatória"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z.string().min(2, "UF obrigatório"),
  reference: z.string().optional(),
});

export const cardSchema = z.object({
  cardNumber: z.string().min(19, "Número do cartão incompleto"),
  cardName: z.string().min(1, "Nome no cartão obrigatório"),
  expiry: z.string().min(5, "Validade incompleta"),
  cvv: z.string().min(3, "CVV incompleto"),
  installments: z.string().min(1, "Selecione as parcelas"),
});

export const checkoutSchema = z.object({
  ...customerSchema.shape,
  ...shippingSchema.shape,
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Aceite os termos para continuar" }),
  }),
});
