# teste NOVO

Você é um especialista sênior em UX/UI de checkout (focado em conversão), front-end moderno e integrações de pagamento. 

Crie um CHECKOUT completo para PRODUTOS FÍSICOS, pronto para eu integrar a API de pagamentos via Lovable.

OBJETIVO

- Criar um checkout moderno, profissional e altamente orientado à conversão.

- Suportar pagamento via PIX e Cartão de Crédito (Mercado Pago).

- Após gerar o PIX, permitir que o cliente ANEXE e ENVIE o comprovante no próprio checkout.

- Interface rápida, limpa e com sensação de confiança (design de checkout premium).

STACK / ESTRUTURA DO APP

- App web responsivo (mobile-first).

- Página única principal: /checkout

- Componentes organizados por seções: Header, Resumo do pedido, Dados do cliente, Entrega, Pagamento, Confirmação.

- Validações robustas no front-end e tratamento de erros.

- Estado de carregamento (skeleton/loader) em ações críticas (gerar PIX, tokenizar cartão, confirmar pedido).

IDENTIDADE VISUAL (CONVERSÃO)

- Header fixo com:

  - Logo do Mercado Pago no topo (à esquerda)

  - Selo “Ambiente Seguro” + ícone de cadeado

  - Microtexto: “Pagamento processado com segurança”

- Layout em 2 colunas no desktop:

  - Esquerda: Formulário

  - Direita: Resumo do pedido (sticky)

- No mobile: resumo recolhível (accordion) “Ver resumo do pedido”.

- Botão CTA grande, claro e direto: “Finalizar Compra”.

- Provas de confiança:

  - “Entrega para todo o Brasil”

  - “Suporte via WhatsApp”

  - “Compra protegida”

- Evitar distrações: sem menus, sem links externos, sem rodapé longo.

PRODUTO / RESUMO DO PEDIDO (DADOS MOCK + PRONTO PRA INTEGRAR)

- Mostrar card com:

  - Foto do produto, nome, variação (se houver), quantidade, subtotal

  - Frete (calculado ou fixo por enquanto)

  - Total final

- Permitir cupom (campo opcional) com validação e feedback.

- Exibir parcelas estimadas (quando cartão) após o usuário selecionar cartão.

FORMULÁRIO — DADOS DO CLIENTE (obrigatórios)

1) Email (obrigatório, validar formato)

2) Nome completo (obrigatório, min 2 palavras)

3) CPF (obrigatório)

   - máscara: 000.000.000-00

   - validação de dígitos (se possível)

4) Telefone (opcional, mas recomendado p/ conversão)

   - máscara BR (xx) xxxxx-xxxx

ENDEREÇO DE ENTREGA (obrigatório)

- CEP (obrigatório, máscara 00000-000)

  - Ao digitar CEP, buscar endereço automaticamente (rua, bairro, cidade, UF) e permitir edição.

- Número (obrigatório)

- Complemento (opcional)

- Rua (obrigatório)

- Bairro (obrigatório)

- Cidade (obrigatório)

- UF (obrigatório)

- Referência (opcional)

PAGAMENTO — ABAS (PIX / CARTÃO)

Crie um seletor de método de pagamento em abas:

- Aba 1: PIX (recomendado e destacado com etiqueta “Aprovação rápida”)

- Aba 2: Cartão de Crédito

FLUXO PIX (MERCADO PAGO)

- Botão: “Gerar PIX”

- Ao clicar:

  - Validar todos os campos obrigatórios

  - Chamar a função de integração (placeholder) para criar pagamento PIX e retornar:

    - qr_code_base64 (ou link imagem)

    - copia_e_cola (string)

    - payment_id

    - status inicial

    - expires_at (tempo de expiração)

- Mostrar:

  - QR Code grande

  - Campo “PIX Copia e Cola” com botão “Copiar”

  - Timer de expiração (ex.: “Expira em 15:00”)

  - Status: “Aguardando pagamento”

  - Botão “Já paguei / Enviar comprovante”

UPLOAD DE COMPROVANTE (APÓS GERAR PIX)

- Somente aparecer depois do PIX ser gerado (e quando existir payment_id).

- Criar área de upload moderna (drag & drop + clique), aceitando:

  - JPG, PNG, PDF

  - limite: 10MB

- Ao anexar:

  - Mostrar preview (imagem) ou nome do arquivo (PDF)

  - Campo opcional: “Observação do pagamento”

  - Botão: “Enviar comprovante”

- Ao enviar:

  - Fazer upload do arquivo para storage (ou endpoint) e salvar o vínculo:

    - payment_id

    - email

    - cpf

    - order_id

    - arquivo_url

    - timestamp

- Exibir feedback claro:

  - “Comprovante enviado com sucesso. Vamos validar e te avisar por email/WhatsApp.”

- Criar também um componente de “Ajuda”:

  - “Onde encontro o comprovante?”

  - “E se o PIX demorar para aprovar?”

FLUXO CARTÃO DE CRÉDITO (MERCADO PAGO)

- Campos (com máscara e validação):

  - Número do cartão

  - Nome no cartão

  - Validade (MM/AA)

  - CVV

  - Parcelas (select; carregar opções do backend quando possível)

- Ação:

  - Botão: “Pagar com cartão”

  - Chamar função placeholder para tokenização/criação do pagamento.

- Tratar erros comuns:

  - “Cartão recusado”, “Dados inválidos”, “Limite excedido”, “Tente outro cartão”

- Mostrar tela/estado de sucesso com:

  - “Pedido confirmado”

  - Número do pedido

  - Email de confirmação

REGRAS DE VALIDAÇÃO E EXPERIÊNCIA

- Validar em tempo real e também no submit.

- Mensagens de erro curtas e humanas.

- Se houver erros, rolar até o primeiro erro e destacar o campo.

- Auto-focus no próximo campo no mobile quando apropriado.

- Salvar progresso local (localStorage) para evitar perda do formulário.

- Mostrar “Checkout Seguro” + cadeado sempre visível no topo.

- Performance: carregamento rápido, poucas animações, foco em clareza.

INTEGRAÇÃO (PLACEHOLDERS QUE EU VOU CONECTAR)

Implemente as funções/handlers claramente separadas (mesmo que como placeholders):

- createPixPayment(payload) -> retorna { payment_id, qr_code_base64, copia_e_cola, expires_at, status }

- createCardPayment(payload) -> retorna { payment_id, status, order_id }

- fetchAddressByCep(cep) -> retorna { street, neighborhood, city, state }

- uploadPaymentProof(file, meta) -> retorna { file_url }

- checkPaymentStatus(payment_id) -> (opcional) polling/manual “Atualizar status”

Estruture o payload com:

- customer: { email, full_name, cpf, phone }

- shipping_address: { cep, street, number, complement, neighborhood, city, state, reference }

- order: { items:[{id,name,qty,price}], shipping_cost, discount, total }

- payment: { method: "pix"|"card", installments?, token? }

PÁGINAS / ESTADOS

1) /checkout (principal)

2) Modal/step de “Pagamento PIX gerado” (ou seção expandida)

3) Estado de sucesso: /success?order_id=...

4) Estado de erro amigável com opção “Tentar novamente” e manter dados preenchidos

SEGURANÇA / COMPLIANCE (UI)

- Checkbox obrigatório:

  - “Li e concordo com os Termos e Política de Privacidade”

- Link para Termos e Privacidade (pode ser placeholder).

- Não registrar dados sensíveis do cartão no front. (Somente tokenização via provedor.)

DETALHES DE UI QUE EU QUERO

- Botões grandes, cantos levemente arredondados, tipografia moderna.

- Resumo do pedido com linha “Total” bem destacada.

- PIX com destaque visual e instruções simples (1-2-3).

- Componentes com estados: idle/loading/success/error.

- Microcopy de conversão:

  - “Seus dados estão protegidos.”

  - “Você receberá atualizações do pedido no email.”

ENTREGA DO QUE VOCÊ DEVE GERAR

- Implementar o checkout completo com todos os componentes.

- Mock de produto e valores, mas com estrutura pronta para receber dados reais via query/props.

- Criar as funções placeholder de integração bem documentadas para eu apenas plugar as credenciais/endpoint.

- Garantir que o upload do comprovante só apareça depois do PIX ser gerado e tenha payment_id.

IMPORTANTE

- Não use nada “fake” que engane o usuário. O upload de comprovante é apenas para envio do arquivo e validação posterior.

- Mantenha o design extremamente profissional e orientado à conversão.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://easy-buy-checkout.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/79fee433-bd69-4c2f-b110-ce33512245f6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
