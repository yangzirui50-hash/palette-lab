import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'
const storageKey = 'palette-lab-theme'

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(storageKey)
    return saved === 'dark' || saved === 'light' ? saved : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#f6f7f6')
    localStorage.setItem(storageKey, theme)
  }, [theme])

  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light')
  return { theme, toggleTheme }
}
