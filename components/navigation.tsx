"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { supabase } from "@/lib/supabase"
import { Users, Calendar, Clock, DollarSign, Package, Menu, LogOut, Home, Settings, Moon, Sun, StickyNote } from "lucide-react"

const navigation = [
  { name: "Painel", href: "/dashboard", icon: Home },
  { name: "Alunos", href: "/students", icon: Users },
  { name: "Turmas", href: "/classes", icon: Calendar },
  { name: "Aulas Particulares", href: "/private-lessons", icon: Clock },
  { name: "Financeiro", href: "/finance", icon: DollarSign },
  { name: "Materiais", href: "/materials", icon: Package },
  { name: "Anotações", href: "/notes", icon: StickyNote },
  { name: "Configurações", href: "/settings", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const { signOut, user, refreshProfile } = useAuth()
  const { theme, setTheme, actualTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null)

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getThemeIcon = () => {
    if (theme === "dark" || (theme === "system" && actualTheme === "dark")) {
      return Moon
    }
    return Sun
  }

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  const fetchUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao buscar perfil:", error)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    }
  }

  const getUserInitials = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      const emailName = user.email.split("@")[0]
      return emailName.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  const getUserDisplayName = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name
    }
    if (user?.email) {
      return user.email.split("@")[0]
    }
    return "Usuário"
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:bg-green-50 dark:md:bg-black md:border-r md:border-green-200 dark:md:border-gray-700 z-50">
        <div className="flex items-center h-16 px-6 border-b border-green-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-400">Teep</h1>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href 
                    ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100" 
                    : "text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-green-200 dark:border-gray-700">
          <Link href="/settings" className="flex items-center gap-3 mb-4 p-2 rounded-lg hover:bg-green-100 dark:hover:bg-gray-800 transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-green-600 text-white">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-100 truncate">{getUserDisplayName()}</p>
              <p className="text-xs text-green-600 dark:text-green-300 truncate">{user?.email}</p>
            </div>
          </Link>
          <div className="space-y-2">
            <Button onClick={toggleTheme} variant="ghost" className="w-full justify-start text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-gray-800">
              {(() => {
                const ThemeIcon = getThemeIcon()
                return <ThemeIcon className="w-5 h-5 mr-3" />
              })()}
              {theme === "light" ? "Tema Claro" : theme === "dark" ? "Tema Escuro" : "Tema Sistema"}
            </Button>
            <Button onClick={signOut} variant="ghost" className="w-full justify-start text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-gray-800">
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between h-16 px-4 bg-green-50 dark:bg-black border-b border-green-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-green-800 dark:text-green-400">Teep</h1>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-green-600 text-white text-xs">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-green-50 dark:bg-black">
                <div className="py-6 space-y-2">
                  <Link 
                    href="/settings" 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 mb-6 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-green-600 text-white">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 dark:text-green-100 truncate">{getUserDisplayName()}</p>
                      <p className="text-xs text-green-600 dark:text-green-300 truncate">{user?.email}</p>
                    </div>
                  </Link>

                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          pathname === item.href 
                            ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100" 
                            : "text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </Link>
                    )
                  })}
                  <div className="mt-4 space-y-2">
                    <Button
                       onClick={() => {
                         toggleTheme()
                       }}
                       variant="ghost"
                       className="w-full justify-start text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-gray-800"
                     >
                       {(() => {
                         const ThemeIcon = getThemeIcon()
                         return <ThemeIcon className="w-5 h-5 mr-3" />
                       })()}
                       {theme === "light" ? "Tema Claro" : theme === "dark" ? "Tema Escuro" : "Tema Sistema"}
                     </Button>
                     <Button
                       onClick={() => {
                         signOut()
                         setOpen(false)
                       }}
                       variant="ghost"
                       className="w-full justify-start text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-gray-800"
                     >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sair
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navigation
