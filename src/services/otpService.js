/**
 * OTP Service – generates a 6-digit code and sends it via EmailJS.
 * Also fires a browser Notification + custom 'otp-toast' event for UI feedback.
 */

import emailjs from '@emailjs/browser'

const SERVICE_ID  = 'iHrU0CHXmi5SXfRJ7E46A'
const TEMPLATE_ID = 'template_pxc66y7'
const PUBLIC_KEY  = 'kLiAq79ZBAjG8epzA'

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
 * Send an OTP to the given email via EmailJS.
 * @param {string} [emailOverride] – optional email; falls back to localStorage 'user_email'
 * @param {'onboarding'|'transfer'} [type='onboarding'] – email template variant
 * @returns {Promise<{ success: boolean, code?: string, email?: string }>}
 */
export async function sendOtp(emailOverride, type = 'onboarding') {
  const email = emailOverride || localStorage.getItem('user_email') || ''
  const code = generateOtp()

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, { otp_code: code }, PUBLIC_KEY)
    // EmailJS delivered successfully
    notifyOtp(code, email)
    return { success: true, code, email }
  } catch (err) {
    console.warn('EmailJS send failed, falling back to demo mode:', err)
  }

  // Fallback: still show the OTP in toast/notification for demo
  notifyOtp(code, email)
  return { success: true, code, email, demo: true }
}

export function verifyOtp(input) {
  return input === _lastCode
}
