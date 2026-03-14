import { useEffect, useRef, useState } from 'react'

/**
 * Odometer-style animated balance display.
 * Each digit rolls independently from old → new via CSS transform.
 * Non-digit characters ($, commas, decimals) render statically.
 */

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function OdometerDigit({ digit, duration }) {
  const ref = useRef(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    // Trigger the transition after mount / digit change
    requestAnimationFrame(() => setAnimated(true))
  }, [digit])

  return (
    <span className="odo-digit" aria-hidden="true">
      <span
        ref={ref}
        className="odo-digit-inner"
        style={{
          transform: `translateY(${-digit * 10}%)`,
          transition: animated
            ? `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`
            : 'none',
        }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="odo-digit-char">
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

export default function AnimatedBalance({ value, className = '' }) {
  // Accept number or formatted string — normalise to number then format
  const num =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).replace(/,/g, '')) || 0

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const chars = `$${formatted}`.split('')

  // Stagger duration per-digit for a rolling wave effect
  const digitCount = chars.filter((c) => /\d/.test(c)).length
  let digitIndex = 0

  return (
    <span className={`odo ${className}`} aria-label={`$${formatted}`}>
      {chars.map((char, i) => {
        if (/\d/.test(char)) {
          const idx = digitIndex++
          // Higher-order digits roll slower, lower-order faster
          const duration = 600 + (digitCount - idx) * 60
          return (
            <OdometerDigit
              key={`${i}-${char}`}
              digit={parseInt(char, 10)}
              duration={Math.min(duration, 1200)}
            />
          )
        }
        return (
          <span key={i} className="odo-static">
            {char}
          </span>
        )
      })}
    </span>
  )
}
