import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendUtmifyOrder } from '../_shared/utmify.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const token = Deno.env.get('UTMIFY_API_TOKEN')
  if (!token) {
    return new Response(
      JSON.stringify({ ok: false, error: 'UTMIFY_API_TOKEN não configurado' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Captura logs desta invocação para retornar no response
  const captured: string[] = []
  const origLog = console.log
  const origErr = console.error
  console.log = (...args: unknown[]) => {
    captured.push(args.map(String).join(' '))
    origLog(...args)
  }
  console.error = (...args: unknown[]) => {
    captured.push('[ERR] ' + args.map(String).join(' '))
    origErr(...args)
  }

  const now = new Date()
  const orderId = `TEST_${now.getTime()}`

  try {
    await sendUtmifyOrder({
      orderId,
      status: 'waiting_payment',
      paymentMethod: 'pix',
      createdAt: now,
      customer: {
        name: 'Teste UTMify',
        email: 'teste@example.com',
        phone: '11999999999',
        document: '00000000000',
        ip: '0.0.0.0',
      },
      products: [
        { id: 'test-product', name: 'Produto de Teste', quantity: 1, priceInCents: 100 },
      ],
      totalInCents: 100,
      tracking: {
        utm_source: 'utmify-test',
        utm_medium: 'admin',
        utm_campaign: 'token-validation',
      },
    })
  } finally {
    console.log = origLog
    console.error = origErr
  }

  const responseLine = captured.find((l) => l.startsWith('UTMify response')) || ''
  const match = responseLine.match(/\[(\d{3})\]:\s*(.*)$/)
  const status = match ? Number(match[1]) : null
  const body = match ? match[2] : responseLine
  const ok = status !== null && status >= 200 && status < 300

  return new Response(
    JSON.stringify({ ok, orderId, status, body, logs: captured }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})