// Netlify Serverless Function – Send OTP via Resend
// Endpoint: /.netlify/functions/send-otp

export default async (req) => {
  // Only allow POST
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

  const { email, code, type } = body

  if (!email || !code) {
    return new Response(
      JSON.stringify({ error: 'Missing email or code' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email format' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const subject = type === 'transfer'
    ? 'TD Bank – Transfer Verification Code'
    : 'TD Bank – Email Verification Code'

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #2d6a2e 0%, #4caf50 100%); margin-bottom: 12px;"></div>
        <h1 style="font-size: 22px; font-weight: 700; color: #1f2937; margin: 0;">TD Bank</h1>
      </div>
      <div style="background: #f9fafb; border-radius: 16px; padding: 32px 24px; text-align: center;">
        <p style="font-size: 15px; color: #4b5563; margin: 0 0 20px;">
          ${type === 'transfer' ? 'Your transfer verification code is:' : 'Your email verification code is:'}
        </p>
        <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 36px; font-weight: 700; letter-spacing: 0.3em; color: #008a00; padding: 16px 0;">
          ${code}
        </div>
        <p style="font-size: 13px; color: #9ca3af; margin: 20px 0 0;">
          This code expires in 10 minutes. Do not share it with anyone.
        </p>
      </div>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px;">
        If you didn't request this code, please ignore this email.
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
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Email service unavailable' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const config = {
  path: '/api/send-otp',
}
