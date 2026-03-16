import { useState, useEffect } from 'react'

const CRYPTO = [
  { symbol: 'BTC', name: 'Bitcoin',  price: 72300.00,  change: +2.4, color: '#f7931a', holdings: 0.45 },
  { symbol: 'ETH', name: 'Ethereum', price: 2125.50,   change: +1.8, color: '#627eea', holdings: 3.2 },
  { symbol: 'SOL', name: 'Solana',   price: 90.14,     change: -0.6, color: '#00ffa3', holdings: 25 },
  { symbol: 'ADA', name: 'Cardano',  price: 0.45,      change: +3.1, color: '#0033ad', holdings: 5000 },
  { symbol: 'DOT', name: 'Polkadot', price: 7.82,      change: -1.2, color: '#e6007a', holdings: 120 },
  { symbol: 'LINK', name: 'Chainlink', price: 14.56,   change: +0.9, color: '#2a5ada', holdings: 80 },
]

const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const TrendUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const TrendDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
)

export default function CryptoPage({ onClose }) {
  const [prices, setPrices] = useState(() =>
    CRYPTO.map((c) => ({ ...c }))
  )

  // Simulate live price ticks every 4 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      setPrices((prev) =>
        prev.map((c) => {
          const delta = (Math.random() - 0.48) * c.price * 0.004
          const newPrice = Math.max(0.01, c.price + delta)
          const newChange = +(c.change + (Math.random() - 0.48) * 0.15).toFixed(2)
          return { ...c, price: newPrice, change: newChange }
        })
      )
    }, 4000)
    return () => clearInterval(iv)
  }, [])

  const totalPortfolio = prices.reduce((sum, c) => sum + c.price * c.holdings, 0)

  return (
    <div className="crypto-page">
      {/* Header */}
      <header className="crypto-page-header">
        <button className="crypto-page-back" onClick={onClose}>
          <BackIcon />
        </button>
        <h1 className="crypto-page-title">Digital Assets</h1>
        <div style={{ width: 22 }} />
      </header>

      {/* Portfolio summary */}
      <section className="crypto-page-portfolio">
        <span className="crypto-page-portfolio-label">Portfolio Value</span>
        <span className="crypto-page-portfolio-value">
          ${totalPortfolio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </section>

      {/* Asset list */}
      <section className="crypto-page-list">
        {prices.map((c) => (
          <div key={c.symbol} className="crypto-page-row">
            <div className="crypto-page-icon" style={{ background: c.color }}>
              {c.symbol.charAt(0)}
            </div>
            <div className="crypto-page-info">
              <span className="crypto-page-name">{c.name}</span>
              <span className="crypto-page-symbol">{c.symbol} · {c.holdings} units</span>
            </div>
            <div className="crypto-page-price-col">
              <span className="crypto-page-price">
                ${c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`crypto-page-change ${c.change >= 0 ? 'crypto-page-change--up' : 'crypto-page-change--down'}`}>
                {c.change >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                {c.change >= 0 ? '+' : ''}{c.change}%
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Disclaimer */}
      <p className="crypto-page-disclaimer">
        Prices update in real-time. Trading crypto involves risk. Past performance is not indicative of future results.
      </p>
    </div>
  )
}
