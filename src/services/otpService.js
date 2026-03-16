/**
 * OTP Service – generates a 6-digit code and sends it via EmailJS.
 * The OTP is never exposed in console, alerts, or browser notifications.
 */

import emailjs from '@emailjs/browser'

const SERVICE_ID  = 'iHrU0CHXmi5SXfRJ7E46A'
const TEMPLATE_ID = 'template_pxc66y7'
const PUBLIC_KEY  = 'kLiAq79ZBAjG8epzA'

// Initialize EmailJS once
emailjs.init(PUBLIC_KEY)

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
 * Send an OTP to the given email via EmailJS.
 * @param {string} [emailOverride] – optional email; falls back to localStorage 'user_email'
 * @param {'onboarding'|'transfer'} [type='onboarding'] – email template variant
 * @returns {Promise<{ success: boolean, code?: string, email?: string, error?: boolean }>}
 */
export async function sendOtp(emailOverride, type = 'onboarding') {
  const email = emailOverride || localStorage.getItem('user_email') || ''
  const code = generateOtp()

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, { otp_code: code })
    return { success: true, code, email }
  } catch {
    // Dispatch error toast so the UI can show a connection error
    window.dispatchEvent(new CustomEvent('otp-toast', {
      detail: {
        email,
        message: 'Connection Error: Could not send verification email. Please check your internet.',
        isError: true
      }
    }))
    return { success: false, code, email, error: true }
  }
}

export function verifyOtp(input) {
  return input === _lastCode
}
