// Netlify Serverless Function – Send transaction alert email via Resend
// Endpoint: /.netlify/functions/send-alert  →  /api/send-alert

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.FROM_EMAIL || 'TD Bank <noreply@tdbank.com>'

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { email, alertType, amount, newBalance } = body

  if (!email || !alertType || !amount) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email format' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const isCredit = alertType === 'credit'
  const subject = isCredit
    ? `TD Bank – Credit Alert: +$${amount}`
    : `TD Bank – Debit Alert: -$${amount}`

  const accentColor = isCredit ? '#16a34a' : '#dc2626'
  const icon = isCredit ? '↓' : '↑'
  const label = isCredit ? 'CREDIT' : 'DEBIT'
  const signedAmount = isCredit ? `+$${amount}` : `-$${amount}`
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #2d6a2e 0%, #4caf50 100%); margin-bottom: 12px;"></div>
        <h1 style="font-size: 22px; font-weight: 700; color: #1f2937; margin: 0;">TD Bank</h1>
      </div>
      <div style="background: #f9fafb; border-radius: 16px; padding: 32px 24px; text-align: center;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: ${accentColor}15; margin-bottom: 16px;">
          <span style="font-size: 24px; color: ${accentColor};">${icon}</span>
        </div>
        <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; color: ${accentColor}; margin: 0 0 8px; text-transform: uppercase;">${label} ALERT</p>
        <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; color: ${accentColor}; padding: 8px 0;">
          ${signedAmount}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <table style="width: 100%; font-size: 14px; color: #4b5563;">
          <tr>
            <td style="text-align: left; padding: 6px 0; font-weight: 600;">New Balance</td>
            <td style="text-align: right; padding: 6px 0; font-family: monospace; font-weight: 700;">$${newBalance}</td>
          </tr>
          <tr>
            <td style="text-align: left; padding: 6px 0; font-weight: 600;">Date & Time</td>
            <td style="text-align: right; padding: 6px 0;">${timestamp}</td>
          </tr>
          <tr>
            <td style="text-align: left; padding: 6px 0; font-weight: 600;">Reference</td>
            <td style="text-align: right; padding: 6px 0; font-family: monospace;">${Math.random().toString(36).slice(2, 10).toUpperCase()}</td>
          </tr>
        </table>
      </div>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px;">
        This is an automated transaction alert from TD Bank. If you did not authorize this transaction, please contact support immediately.
      </p>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject,
        html: htmlBody,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return new Response(
        JSON.stringify({ error: errData.message || 'Failed to send email' }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await res.json()
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: 'Email service unavailable' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const config = {
  path: '/api/send-alert',
}
