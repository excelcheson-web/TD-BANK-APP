/* TD Bank – Green shield logo as inline SVG */
export default function TDLogo({ size = 48, className = '', style }) {
  // Use the official TD Bank SVG logo from Wikimedia with fixed style for best fit
  return (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/a/a4/TD_Bank_logo.svg"
      alt="TD Bank logo"
      className={className}
      style={{ width: '80px', height: 'auto', ...style }}
      aria-label="TD Bank logo"
      draggable="false"
    />
  )
}
