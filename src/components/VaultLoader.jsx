export default function VaultLoader({ message = 'Securing your session…' }) {
  return (
    <div className="vault-loader-screen">
      {/* TD Bank Logo */}
      <div className="vault-logo">
        <img src="/td-logo.png" alt="TD Bank" className="td-logo" width="64" height="64" />
      </div>
      {/* Spinning vault */}
      <div className="vault">
        <div className="vault-door">
          <div className="vault-ring vault-ring--outer" />
          <div className="vault-ring vault-ring--inner" />
          <div className="vault-handle">
            <div className="vault-spoke" />
            <div className="vault-spoke" />
            <div className="vault-spoke" />
          </div>
          <div className="vault-center" />
        </div>
      </div>
      <p className="vault-message">{message}</p>
      <div className="vault-dots">
        <span /><span /><span />
      </div>
    </div>
  )
}
