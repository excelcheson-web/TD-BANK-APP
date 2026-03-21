import en from './en'
import fr from './fr'
import es from './es'
import zh from './zh'
import ar from './ar'
import hi from './hi'
import pt from './pt'
import de from './de'

const translations = { en, fr, es, zh, ar, hi, pt, de }

export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
  { code: 'ar', label: 'العربية',     flag: '🇸🇦' },
  { code: 'hi', label: 'हिन्दी',       flag: '🇮🇳' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
]

export default translations
