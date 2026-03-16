/**
 * OTP Service – generates a 6-digit code and sends it via Resend
 * through a Netlify serverless function at /api/send-otp.
 *
 * Falls back to demo mode: shows a browser Notification + fires a
 * custom 'otp-toast' event so the UI can display a toast with the code.
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
 * Show a browser Notification + dispatch a toast event with the OTP code.
 */
function notifyOtp(code, email) {
  const msg = `[Internal System] OTP for your transfer is: ${code}`

  // Fire custom event so the app can show a toast
  window.dispatchEvent(new CustomEvent('otp-toast', {
    detail: { code, email, message: msg }
  }))

  // Also attempt a browser Notification
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('TD Bank – OTP Code', { body: `Sent to ${email}\nYour code: ${code}`, icon: '/td-logo.png' })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification('TD Bank – OTP Code', { body: `Sent to ${email}\nYour code: ${code}`, icon: '/td-logo.png' })
        }
      })
    }
  }
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

  // Demo fallback: show notification/toast with the code
  notifyOtp(code, email)
  return { success: true, code, demo: true }
}

export function verifyOtp(input) {
  return input === _lastCode
}
