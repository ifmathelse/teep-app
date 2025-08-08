"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { SupabaseFallback } from "@/components/supabase-fallback"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [configChecked, setConfigChecked] = useState(false)
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0)

  useEffect(() => {
    const checkConfigAndInitialize = async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false)
        setConfigChecked(true)
        return
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          setUser(session?.user ?? null)
        })

        setConfigChecked(true)
        setLoading(false)

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error("Erro ao inicializar Supabase:", error)
        setLoading(false)
        setConfigChecked(true)
      }
    }

    checkConfigAndInitialize()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase não está configurado")
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        console.error("Supabase sign in error:", error)
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.")
        }
        throw new Error(error.message || "Erro ao fazer login")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase não está configurado")
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: name || '',
          },
        },
      })
      if (error) {
        console.error("Supabase sign up error:", error)
        throw new Error(error.message || "Erro ao criar conta")
      }
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = () => {
    setProfileRefreshTrigger(prev => prev + 1)
  }

  if (!configChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-black dark:to-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!isSupabaseConfigured()) {
    return <SupabaseFallback />
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthProvider
