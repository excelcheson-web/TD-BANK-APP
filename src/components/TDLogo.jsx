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
  // Use the official TD Bank SVG logo from Wikimedia
  return (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/a/a4/TD_Bank_logo.svg"
      width={size}
      height={size}
      alt="TD Bank logo"
      className={className}
      style={style}
      aria-label="TD Bank logo"
      draggable="false"
    />
    </svg>
  )
}
