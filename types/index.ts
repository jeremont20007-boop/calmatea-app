export type UserRole = 'child' | 'parent' | 'admin'
export type PlanType = 'free' | 'premium'
export type EmotionType = 'calm' | 'happy' | 'anxious' | 'sad' | 'angry' | 'tired'
export type SoundCategory = 'rain' | 'ocean' | 'white_noise' | 'brown_noise' | 'forest'
export type RoutineType = 'morning' | 'school' | 'bath' | 'sleep'

export interface Profile {
  id: string
  user_id: string
  full_name: string
  avatar_url?: string
  role: UserRole
  plan: PlanType
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: string
  favorite_sound?: SoundCategory
  parent_id?: string
  created_at: string
  updated_at: string
}

export interface Sound {
  id: string
  name: string
  category: SoundCategory
  file_url: string
  emoji: string
  is_premium: boolean
  color: string
}

export interface EmotionLog {
  id: string
  child_id: string
  emotion: EmotionType
  note?: string
  sound_played?: SoundCategory
  created_at: string
}

export interface SoundSession {
  id: string
  child_id: string
  sound_category: SoundCategory
  duration_seconds: number
  triggered_by: 'manual' | 'emergency'
  created_at: string
}

export interface Routine {
  id: string
  type: RoutineType
  name: string
  steps: RoutineStep[]
  is_premium: boolean
}

export interface RoutineStep {
  id: string
  order: number
  title: string
  pictogram: string
  duration_minutes?: number
}

export interface RoutineProgress {
  id: string
  child_id: string
  routine_type: RoutineType
  completed_steps: number[]
  completed_at?: string
  created_at: string
}
