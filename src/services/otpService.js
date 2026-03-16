/**
 * OTP Service – pure frontend EmailJS setup.
 * No Netlify functions, no Stripe, no server calls.
 */

import emailjs from '@emailjs/browser'

const SERVICE_ID  = 'iHrU0CHXmi5SXfRJ7E46A'
const TEMPLATE_ID = 'template_pxc66y7'
const PUBLIC_KEY  = 'kLiAq79ZBAjG8epzA'

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
 * Send an OTP email via EmailJS (frontend-only).
 * Uses .then()/.catch() — no server endpoints.
 */
export function sendOtp(onSuccess, onError) {
  const code = generateOtp()

  const templateParams = {
    to_email: localStorage.getItem('user_email'),
    otp_code: code,
    user_name: localStorage.getItem('user_name')
  }

  emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
    .then((response) => {
      console.log('SUCCESS!', response.status, response.text)
      if (onSuccess) onSuccess(code)
    })
    .catch((err) => {
      console.error('EmailJS Error:', err)
      if (onError) onError(err)
    })

  return code
}

export function verifyOtp(input) {
  return input === _lastCode
}
