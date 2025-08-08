"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system")
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Carregar tema salvo do localStorage
    const savedTheme = localStorage.getItem("teep-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    // Salvar tema no localStorage
    localStorage.setItem("teep-theme", theme)

    // Determinar o tema atual
    let currentTheme: "light" | "dark"
    
    if (theme === "system") {
      currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    } else {
      currentTheme = theme
    }

    setActualTheme(currentTheme)

    // Aplicar classe ao documento
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(currentTheme)
  }, [theme])

  useEffect(() => {
    // Escutar mudanças no tema do sistema
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      if (theme === "system") {
        const currentTheme = mediaQuery.matches ? "dark" : "light"
        setActualTheme(currentTheme)
        
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(currentTheme)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}