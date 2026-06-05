// Theme plumbing: a context so deep components (the code block needs to pick
// a Prism palette) can read the active theme without prop-drilling, plus the
// localStorage persistence and the <html> class flip that actually re-skins
// the CSS variables.

import { createContext, useContext, useEffect, useState } from 'react'

const THEME_KEY = 'nbe:theme'

export const ThemeContext = createContext('light')
export const useTheme = () => useContext(ThemeContext)

export function getInitialTheme() {
  // Explicit choice wins; otherwise follow the OS so the app doesn't flash
  // the wrong mode on first visit.
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useThemeState() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    // The class lives on <html> rather than a React node so the tokens apply
    // to everything — including portals and the body background.
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}
