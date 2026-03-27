/**
 * Tipi TypeScript che rispecchiano le tabelle del database Supabase.
 * Analogia Laravel: come i Model, ma sono solo "forme" dei dati (no logica).
 */

export type RoleType = "invigilator" | "supervisor"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role_type: RoleType
  default_hourly_rate: number
  rounding_mode: string
  created_at: string
  updated_at: string
}

export interface OnboardingData {
  full_name: string
  role_type: RoleType
  default_hourly_rate: number
}
