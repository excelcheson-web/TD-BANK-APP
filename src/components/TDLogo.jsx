/* TD Bank – Square green logo from local file */

export default function TDLogo({ size = 48, className = '', style }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '18px',
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        padding: '6px',
      }}
    >
      <img
        src="/td-logo.png"
        alt="TD Bank logo"
        className={className}
        style={{ width: '80px', height: '80px', borderRadius: '14px', display: 'block', ...style }}
        aria-label="TD Bank logo"
        draggable="false"
      />
    </div>
  )
}
