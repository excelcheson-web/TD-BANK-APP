import { useState, useRef } from 'react'
import OtpModal from './OtpModal'

/* ── Inline SVG icons ────────────────────────────────────── */
const UserIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const LockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const FingerprintIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
    <path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 2 0 3.8 1 4.8 2.5" />
    <path d="M10 12c0 4-1 8-3 11" />
    <path d="M14 12c0 2.5-.5 5-1.5 7.5" />
    <path d="M18 11c0 3-1 6.5-3 9.5" />
    <path d="M22 12c0 2-1 4-2 6" />
  </svg>
)

const CheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const STEPS = [
  { num: 1, label: 'Identity', icon: <UserIcon /> },
  { num: 2, label: 'KYC',      icon: <ShieldIcon /> },
  { num: 3, label: 'Security',  icon: <LockIcon /> },
]

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(1)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState('next')

  /* ── Form state ─────────────────────────────────────────── */
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [idFile, setIdFile] = useState(null)
  const [profilePic, setProfilePic] = useState(null)
  const profileRef = useRef(null)
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', ''])
  const [biometric, setBiometric] = useState(false)
  const [pinError, setPinError] = useState('')

  const pinRefs = useRef([])
  const confirmPinRefs = useRef([])
  const fileRef = useRef(null)

  /* ── Step navigation ────────────────────────────────────── */
  const goTo = (target) => {
    if (target === step || animating) return
    setDirection(target > step ? 'next' : 'prev')
    setAnimating(true)
    setTimeout(() => {
      setStep(target)
      setAnimating(false)
    }, 300)
  }

  const next = () => {
    // On step 1, require email verification before proceeding
    if (step === 1 && !emailVerified) {
      setShowOtp(true)
      return
    }
    if (step < 3) goTo(step + 1)
  }

  const prev = () => {
    if (step > 1) goTo(step - 1)
  }

  /* ── PIN input handler ──────────────────────────────────── */
  const handlePinChange = (idx, value, isConfirm) => {
    if (!/^\d?$/.test(value)) return
    const setter = isConfirm ? setConfirmPin : setPin
    const refs = isConfirm ? confirmPinRefs : pinRefs
    setter((prev) => {
      const next = [...prev]
      next[idx] = value
      return next
    })
    setPinError('')
    if (value && idx < 5) {
      refs.current[idx + 1]?.focus()
    }
  }

  const handlePinKeyDown = (idx, e, isConfirm) => {
    const refs = isConfirm ? confirmPinRefs : pinRefs
    const current = isConfirm ? confirmPin : pin
    if (e.key === 'Backspace' && !current[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  /* ── Generate random 10-digit account number ────────────── */
  const generateAccountNumber = () => {
    const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10))
    digits[0] = digits[0] || 1 // ensure no leading zero
    return digits.join('')
  }

  /* ── Final submit ───────────────────────────────────────── */
  const handleFinish = () => {
    const pinStr = pin.join('')
    const confirmStr = confirmPin.join('')
    if (pinStr.length < 6) {
      setPinError('Please enter all 6 digits')
      return
    }
    if (pinStr !== confirmStr) {
      setPinError('PINs do not match')
      return
    }
    onComplete({
      fullName,
      email,
      dob,
      idFile,
      profilePic,
      pin: pinStr,
      biometric,
      accountNumber: generateAccountNumber(),
    })
  }

  /* ── Can proceed? ───────────────────────────────────────── */
  const canNext =
    step === 1 ? fullName.trim() && email.trim() && dob :
    step === 2 ? true :
    pin.join('').length === 6 && confirmPin.join('').length === 6

  /* ── Step content ───────────────────────────────────────── */
  const renderStep = () => {
    const animClass = `ob-step-content ${animating ? `ob-slide-out-${direction}` : 'ob-slide-in'}`

    if (step === 1) return (
      <div className={animClass} key="step1">
        <div className="ob-step-icon-wrap">
          <UserIcon />
        </div>
        <h2 className="ob-step-title">Identity Details</h2>
        <p className="ob-step-desc">Let&apos;s get to know you</p>

        <div className="ob-field">
          <label className="ob-label" htmlFor="ob-name">Full Name</label>
          <input
            id="ob-name"
            className="ob-input"
            type="text"
            placeholder="John Appleseed"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div className="ob-field">
          <label className="ob-label" htmlFor="ob-email">Email Address</label>
          <div className="ob-input-wrap">
            <input
              id="ob-email"
              className="ob-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailVerified(false) }}
              autoComplete="email"
            />
            {emailVerified && (
              <span className="ob-verified-badge">✓ Verified</span>
            )}
          </div>
        </div>

        <div className="ob-field">
          <label className="ob-label" htmlFor="ob-dob">Date of Birth</label>
          <input
            id="ob-dob"
            className="ob-input"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>

        {/* ── Profile Photo ─────────────────────────────── */}
        <div className="ob-field">
          <label className="ob-label">Profile Photo (optional)</label>
          <div className="ob-pic-zone" onClick={() => profileRef.current?.click()}>
            <input
              ref={profileRef}
              type="file"
              accept="image/*"
              className="ob-file-hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => setProfilePic(ev.target.result)
                  reader.readAsDataURL(file)
                }
              }}
            />
            {profilePic ? (
              <div className="ob-pic-preview">
                <img src={profilePic} alt="" className="ob-pic-img" />
                <span className="ob-upload-change">Tap to change</span>
              </div>
            ) : (
              <div className="ob-upload-placeholder">
                <span style={{ fontSize: '1.5rem' }}>📷</span>
                <span className="ob-upload-text">Upload Profile Photo</span>
                <span className="ob-upload-hint">This will appear on your dashboard</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )

    if (step === 2) return (
      <div className={animClass} key="step2">
        <div className="ob-step-icon-wrap">
          <ShieldIcon />
        </div>
        <h2 className="ob-step-title">Digital Signature &amp; KYC</h2>
        <p className="ob-step-desc">Upload a valid ID for verification</p>

        <div className="ob-upload-zone" onClick={() => fileRef.current?.click()}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="ob-file-hidden"
            onChange={(e) => setIdFile(e.target.files[0] || null)}
          />
          {idFile ? (
            <div className="ob-upload-done">
              <CheckCircle />
              <span className="ob-upload-filename">{idFile.name}</span>
              <span className="ob-upload-change">Tap to change</span>
            </div>
          ) : (
            <div className="ob-upload-placeholder">
              <UploadIcon />
              <span className="ob-upload-text">Upload ID Document</span>
              <span className="ob-upload-hint">Passport, Driver&apos;s License or National&nbsp;ID</span>
            </div>
          )}
        </div>

        <p className="ob-optional-note">
          This step is optional — you can skip and upload later.
        </p>
      </div>
    )

    return (
      <div className={animClass} key="step3">
        <div className="ob-step-icon-wrap">
          <LockIcon />
        </div>
        <h2 className="ob-step-title">Secure Access</h2>
        <p className="ob-step-desc">Protect your account</p>

        {/* Transaction PIN */}
        <div className="ob-field">
          <label className="ob-label">Set 6-Digit Transaction PIN</label>
          <div className="ob-pin-row">
            {pin.map((d, i) => (
              <input
                key={`pin-${i}`}
                ref={(el) => (pinRefs.current[i] = el)}
                className="ob-pin-box"
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handlePinChange(i, e.target.value, false)}
                onKeyDown={(e) => handlePinKeyDown(i, e, false)}
                autoComplete="off"
              />
            ))}
          </div>
        </div>

        <div className="ob-field">
          <label className="ob-label">Confirm PIN</label>
          <div className="ob-pin-row">
            {confirmPin.map((d, i) => (
              <input
                key={`cpin-${i}`}
                ref={(el) => (confirmPinRefs.current[i] = el)}
                className="ob-pin-box"
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handlePinChange(i, e.target.value, true)}
                onKeyDown={(e) => handlePinKeyDown(i, e, true)}
                autoComplete="off"
              />
            ))}
          </div>
          {pinError && <p className="ob-pin-error">{pinError}</p>}
        </div>

        {/* Biometric toggle */}
        <div className="ob-biometric-card" onClick={() => setBiometric(!biometric)}>
          <div className="ob-biometric-left">
            <FingerprintIcon />
            <div>
              <p className="ob-biometric-title">Biometric Access</p>
              <p className="ob-biometric-sub">Use fingerprint or Face ID to log in</p>
            </div>
          </div>
          <div className={`ob-toggle ${biometric ? 'ob-toggle--on' : ''}`}>
            <div className="ob-toggle-knob" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ob-screen">
      {/* OTP verification modal */}
      {showOtp && (
        <OtpModal
          email={email}
          variant="onboarding"
          onVerified={() => {
            setShowOtp(false)
            setEmailVerified(true)
            goTo(2)
          }}
          onCancel={() => setShowOtp(false)}
        />
      )}

      {/* Background blobs */}
      <div className="ob-blob ob-blob--1" />
      <div className="ob-blob ob-blob--2" />
      <div className="ob-blob ob-blob--3" />

      <div className="ob-container">
        {/* Progress bar */}
        <div className="ob-progress">
          {STEPS.map((s) => (
            <div key={s.num} className="ob-progress-step">
              <div
                className={`ob-progress-dot ${step >= s.num ? 'ob-progress-dot--active' : ''} ${step > s.num ? 'ob-progress-dot--done' : ''}`}
                onClick={() => s.num < step && goTo(s.num)}
              >
                {step > s.num ? <CheckCircle /> : s.num}
              </div>
              <span className={`ob-progress-label ${step >= s.num ? 'ob-progress-label--active' : ''}`}>
                {s.label}
              </span>
              {s.num < 3 && (
                <div className={`ob-progress-line ${step > s.num ? 'ob-progress-line--done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Glass card */}
        <div className="ob-card">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="ob-nav">
          {step > 1 ? (
            <button className="ob-nav-btn ob-nav-btn--back" type="button" onClick={prev}>
              Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              className="ob-nav-btn ob-nav-btn--next"
              type="button"
              onClick={next}
              disabled={!canNext}
            >
              Continue
            </button>
          ) : (
            <button
              className="ob-nav-btn ob-nav-btn--next"
              type="button"
              onClick={handleFinish}
              disabled={!canNext}
            >
              Create Account
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
