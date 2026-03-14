/* TD Bank – Green shield logo as inline SVG */
export default function TDLogo({ size = 48, className = '', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      style={style}
      aria-label="TD Bank logo"
    >
      {/* Shield shape */}
      <path
        d="M60 6C40 6 14 14 14 14v46c0 28 46 48 46 48s46-20 46-48V14S86 6 60 6z"
        fill="#2d6a2e"
      />
      <path
        d="M60 12C42 12 20 19 20 19v41c0 24 40 42 40 42s40-18 40-42V19S78 12 60 12z"
        fill="#34a853"
      />
      {/* T letter */}
      <rect x="28" y="38" width="32" height="7" rx="1.5" fill="#fff" />
      <rect x="40" y="38" width="8" height="36" rx="1.5" fill="#fff" />
      {/* D letter */}
      <path
        d="M68 38h10c9 0 16 7 16 17.5S87 73 78 73H68V38z"
        fill="none"
        stroke="#fff"
        strokeWidth="7"
        strokeLinejoin="round"
      />
    </svg>
  )
}
