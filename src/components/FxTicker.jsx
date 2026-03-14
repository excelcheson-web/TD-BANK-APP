import { useState, useEffect, useRef } from 'react'

const FX_PAIRS = [
  { pair: 'EUR/USD', from: 'EUR', to: 'USD' },
  { pair: 'GBP/USD', from: 'GBP', to: 'USD' },
  { pair: 'USD/JPY', from: 'USD', to: 'JPY' },
  { pair: 'USD/CAD', from: 'USD', to: 'CAD' },
]

const FALLBACK = { 'EUR/USD': 1.0891, 'GBP/USD': 1.2941, 'USD/JPY': 148.72, 'USD/CAD': 1.4368 }

export default function FxTicker() {
  const [rates, setRates] = useState(FALLBACK)
  const [live, setLive] = useState(false)
  const tickerRef = useRef(null)

  useEffect(() => {
    let mounted = true
    async function fetchRates() {
      try {
        const symbols = 'EUR,GBP,JPY,CAD'
        const res = await fetch(
          `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${symbols}`
        )
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        if (!mounted) return
        const r = data.rates
        setRates({
          'EUR/USD': +(1 / r.EUR).toFixed(4),
          'GBP/USD': +(1 / r.GBP).toFixed(4),
          'USD/JPY': +r.JPY.toFixed(2),
          'USD/CAD': +r.CAD.toFixed(4),
        })
        setLive(true)
      } catch {
        if (mounted) setLive(false)
      }
    }
    fetchRates()
    const interval = setInterval(fetchRates, 60000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  const items = FX_PAIRS.map((p) => (
    <span key={p.pair} className="fx-item">
      <span className="fx-pair">{p.pair}</span>
      <span className="fx-rate">{rates[p.pair]}</span>
    </span>
  ))

  // Duplicate items for seamless loop
  return (
    <div className="fx-ticker">
      <div className="fx-live-badge">
        <span className="fx-live-dot" />
        <span className="fx-live-text">{live ? 'Live' : 'FX'}</span>
      </div>
      <div className="fx-scroll-wrap" ref={tickerRef}>
        <div className="fx-scroll-track">
          {items}
          {items}
        </div>
      </div>
    </div>
  )
}
