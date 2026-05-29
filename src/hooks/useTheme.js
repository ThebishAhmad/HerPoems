import { useState, useEffect, useCallback } from 'react'

const THEME_KEY = 'inkwell_theme'
const READING_THEME_KEY = 'inkwell_reading_theme'

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem(THEME_KEY) || 'dark'
    })

    const [readingTheme, setReadingThemeState] = useState(() => {
        return localStorage.getItem(READING_THEME_KEY) || 'default'
    })

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem(THEME_KEY, theme)
    }, [theme])

    useEffect(() => {
        document.documentElement.setAttribute('data-reading-theme', readingTheme)
        localStorage.setItem(READING_THEME_KEY, readingTheme)
    }, [readingTheme])

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }, [])

    const setReadingTheme = useCallback(t => {
        setReadingThemeState(t)
    }, [])

    return { theme, toggleTheme, readingTheme, setReadingTheme }
}
