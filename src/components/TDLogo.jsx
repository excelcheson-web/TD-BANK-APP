/* TD Bank – Embedded green shield logo (Base64 SVG) */

// Base64-encoded inline SVG of the TD Bank green shield with white "TD" letters.
// This is fully self-contained — no external requests, no CORS, works on Netlify.
const TD_LOGO_BASE64 =
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M60 6C40 6 14 14 14 14v46c0 28 46 48 46 48s46-20 46-48V14S86 6 60 6z" fill="#1a5336"/>
  <path d="M60 12C42 12 20 19 20 19v41c0 24 40 42 40 42s40-18 40-42V19S78 12 60 12z" fill="#34a853"/>
  <rect x="30" y="38" width="28" height="7" rx="1.5" fill="#fff"/>
  <rect x="40" y="38" width="8" height="34" rx="1.5" fill="#fff"/>
  <path d="M66 38h10c9 0 16 7 16 17s-7 17-16 17H66V38z" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>
</svg>`)

export default function TDLogo({ size = 48, className = '', style }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '10px',
      }}
    >
      <img
        src={TD_LOGO_BASE64}
        alt="TD Bank logo"
        className={className}
        style={{ width: '80px', height: 'auto', ...style }}
        aria-label="TD Bank logo"
        draggable="false"
      />
    </div>
  )
}
