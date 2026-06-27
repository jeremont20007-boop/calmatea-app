export type UserRole = 'conductor' | 'propietario'
export type PlanType = 'free' | 'premium'
export type VehicleStatus = 'disponible' | 'ocupado' | 'pausado'
export type ApplicationStatus = 'pendiente' | 'aceptada' | 'rechazada' | 'retirada'
export type PlatformType = 'uber' | 'cabify' | 'beat' | 'indrive' | 'didi' | 'otra'
export type ScheduleType = 'completo' | 'parcial' | 'fines_de_semana'

export interface Profile {
  id: string
  user_id: string
  full_name: string
  avatar_url?: string
  role: UserRole
  plan: PlanType
  city?: string
  phone?: string
  license_number?: string
  experience_years?: number
  bio?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  owner_id: string
  make: string
  model: string
  year: number
  color: string
  license_plate: string
  platforms: PlatformType[]
  city: string
  revenue_split: number
  schedule: ScheduleType
  description?: string
  status: VehicleStatus
  created_at: string
  updated_at: string
  owner?: Profile
  applications_count?: number
}

export interface Application {
  id: string
  vehicle_id: string
  driver_id: string
  status: ApplicationStatus
  message?: string
  owner_response?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  driver?: Profile
}

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  uber: 'Uber',
  cabify: 'Cabify',
  beat: 'Beat',
  indrive: 'InDriver',
  didi: 'DiDi',
  otra: 'Otra',
}

export const PLATFORM_COLORS: Record<PlatformType, string> = {
  uber: 'bg-black text-white',
  cabify: 'bg-purple-600 text-white',
  beat: 'bg-green-600 text-white',
  indrive: 'bg-blue-600 text-white',
  didi: 'bg-orange-500 text-white',
  otra: 'bg-gray-500 text-white',
}

export const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  completo: 'Tiempo completo',
  parcial: 'Tiempo parcial',
  fines_de_semana: 'Fines de semana',
}

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  disponible: 'Disponible',
  ocupado: 'Ocupado',
  pausado: 'Pausado',
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  retirada: 'Retirada',
}
