/* TD Bank – Green shield logo as inline SVG */
export default function TDLogo({ size = 48, className = '', style }) {
  // Use the official TD Bank SVG logo from Wikimedia with fixed style for best fit
  return (
    <img
      src="https://www.td.com/content/dam/tdct/images/logos/td-logo.png"
      alt="TD Bank logo"
      className={className}
      style={{ width: '80px', height: 'auto', ...style }}
      aria-label="TD Bank logo"
      loading="eager"
      onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=TD' }}
      draggable="false"
    />
  )
}
