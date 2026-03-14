/**
 * OTP Service – generates a 6-digit code and sends it via Resend
 * through a Netlify serverless function at /api/send-otp.
 *
 * Falls back to demo mode (code shown in UI) if the API is
 * unavailable (e.g. local dev without Netlify CLI).
 */

let _lastCode = ''

export function generateOtp() {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  _lastCode = String(array[0] % 1000000).padStart(6, '0')
  return _lastCode
}

export function getLastCode() {
  return _lastCode
}

/**
 * Send an OTP to the given email via the serverless endpoint.
 * @param {string} email – recipient address
 * @param {'onboarding'|'transfer'} [type='onboarding'] – email template variant
 * @returns {Promise<{ success: boolean, code?: string, demo?: boolean }>}
 */
export async function sendOtp(email, type = 'onboarding') {
  const code = generateOtp()

  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, type }),
    })

    if (res.ok) {
      // Email sent successfully — don't expose code to client
      return { success: true }
    }

    // API returned an error — fall through to demo mode
    const err = await res.json().catch(() => ({}))
    console.warn('OTP API error, falling back to demo mode:', err.error || res.status)
  } catch {
    // Network error (local dev, no Netlify Functions) — demo mode
    console.warn('OTP API unreachable, using demo mode')
  }

  // Demo fallback: return code so the UI can display it
  return { success: true, code, demo: true }
}

export function verifyOtp(input) {
  return input === _lastCode
}
