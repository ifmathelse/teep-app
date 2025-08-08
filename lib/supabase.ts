import { createClient } from "@supabase/supabase-js"

// Suas credenciais do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gkhevicrubgcwuvsgnhv.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdraGV2aWNydWJnY3d1dnNnbmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODI4ODYsImV4cCI6MjA2OTY1ODg4Nn0.28HpAantfvn12VqUHIGuvfxHMIe_jheIoh9f35fVJqs"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função para verificar se o Supabase está configurado
export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== "your-project-url" && supabaseAnonKey !== "your-anon-key")
}

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          badge_color: string
          badge_description: string
          birth_date?: string
          address?: string
          emergency_contact?: string
          emergency_phone?: string
          medical_info?: string
          monthly_fee_type: string
          monthly_fee_amount?: number
          payment_day?: number
          discount_percentage?: number
          notes?: string
          documents?: any[]
          status: string
          enrollment_date?: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          badge_color: string
          badge_description: string
          birth_date?: string
          address?: string
          emergency_contact?: string
          emergency_phone?: string
          medical_info?: string
          monthly_fee_type?: string
          monthly_fee_amount?: number
          payment_day?: number
          discount_percentage?: number
          notes?: string
          documents?: any[]
          status?: string
          enrollment_date?: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          badge_color?: string
          badge_description?: string
          birth_date?: string
          address?: string
          emergency_contact?: string
          emergency_phone?: string
          medical_info?: string
          monthly_fee_type?: string
          monthly_fee_amount?: number
          payment_day?: number
          discount_percentage?: number
          notes?: string
          documents?: any[]
          status?: string
          enrollment_date?: string
          created_at?: string
          user_id?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          schedule: string
          days: string[]
          level: string
          observations: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          schedule: string
          days: string[]
          level: string
          observations?: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          schedule?: string
          days?: string[]
          level?: string
          observations?: string
          created_at?: string
          user_id?: string
        }
      }
      private_lessons: {
        Row: {
          id: string
          student_name: string
          student_id: string | null
          date: string
          time: string
          type: "regular" | "makeup" | "trial"
          notes: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          student_name: string
          student_id?: string | null
          date: string
          time: string
          type: "regular" | "makeup" | "trial"
          notes?: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          student_name?: string
          student_id?: string | null
          date?: string
          time?: string
          type?: "regular" | "makeup" | "trial"
          notes?: string
          created_at?: string
          user_id?: string
        }
      }
      payments: {
        Row: {
          id: string
          student_id: string
          month: string
          year: number
          amount: number
          paid: boolean
          due_date: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          student_id: string
          month: string
          year: number
          amount: number
          paid?: boolean
          due_date: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          student_id?: string
          month?: string
          year?: number
          amount?: number
          paid?: boolean
          due_date?: string
          created_at?: string
          user_id?: string
        }
      }
      materials: {
        Row: {
          id: string
          name: string
          quantity: number
          price: number
          purchase_date: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          quantity: number
          price: number
          purchase_date: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          quantity?: number
          price?: number
          purchase_date?: string
          created_at?: string
          user_id?: string
        }
      }
      invoices: {
        Row: {
          id: string
          student_id: string
          student_name: string
          amount: number
          due_date: string
          status: "pending" | "paid" | "overdue"
          month_reference: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          student_id: string
          student_name: string
          amount: number
          due_date: string
          status?: "pending" | "paid" | "overdue"
          month_reference: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          student_id?: string
          student_name?: string
          amount?: number
          due_date?: string
          status?: "pending" | "paid" | "overdue"
          month_reference?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
    }
  }
}
