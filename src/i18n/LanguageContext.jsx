import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import translations from './translations'

const LanguageContext = createContext()

const STORAGE_KEY = 'app_language'

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en'
    } catch {
      return 'en'
    }
  })

  const changeLang = useCallback((code) => {
    setLang(code)
    try { localStorage.setItem(STORAGE_KEY, code) } catch {}
    // Set dir attribute for RTL languages (Arabic)
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
  }, [])

  const t = useCallback((key) => {
    const dict = translations[lang] || translations.en
    return dict[key] || translations.en[key] || key
  }, [lang])

  const isRTL = lang === 'ar'

  const value = useMemo(() => ({ lang, changeLang, t, isRTL }), [lang, changeLang, t, isRTL])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
