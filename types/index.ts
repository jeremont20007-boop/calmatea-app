export type UserRole = 'conductor' | 'propietario' | 'admin'
export type PlanType = 'free' | 'premium'
export type VehicleStatus = 'disponible' | 'ocupado' | 'pausado'
export type ApplicationStatus = 'pendiente' | 'aceptada' | 'rechazada' | 'retirada'
export type PlatformType = 'uber' | 'cabify' | 'beat' | 'indrive' | 'didi' | 'otra'
export type ScheduleType = 'completo' | 'parcial' | 'fines_de_semana'
export type VehicleType = 'remis' | 'taxi' | 'plataforma'
export type DocumentStatus = 'pendiente' | 'aprobado' | 'rechazado'

export type DriverDocType =
  | 'licencia_conducir'
  | 'dni_frente'
  | 'dni_dorso'
  | 'credencial_remis'
  | 'antecedentes_nacionales'
  | 'antecedentes_provinciales'
  | 'seguro_excedentes'

export type VehicleDocType =
  | 'titulo_propiedad'
  | 'cedula_verde'
  | 'seguro_vehiculo'
  | 'habilitacion_remis'
  | 'habilitacion_taxi'

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
  available_days?: string[]
  preferred_schedule?: ScheduleType
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
  vehicle_type: VehicleType
  is_in_remis_base: boolean
  remis_base_name?: string
  neuquen_only: boolean
  available_days?: string[]
  available_hours?: string
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
  driver_offered_split?: number
  driver_available_days?: string[]
  driver_schedule?: ScheduleType
  accepted_legal_disclaimer: boolean
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  driver?: Profile
}

export interface DriverDocument {
  id: string
  driver_id: string
  doc_type: DriverDocType
  file_url?: string
  status: DocumentStatus
  expires_at?: string
  notes?: string
  uploaded_at: string
}

export interface VehicleDocument {
  id: string
  vehicle_id: string
  doc_type: VehicleDocType
  file_url?: string
  status: DocumentStatus
  expires_at?: string
  notes?: string
  uploaded_at: string
}

// ─── Labels & constants ─────────────────────────────────────────────────────

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  uber: 'Uber',
  cabify: 'Cabify',
  beat: 'Beat',
  indrive: 'InDriver',
  didi: 'DiDi',
  otra: 'Otra',
}

export const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  completo: 'Tiempo completo',
  parcial: 'Tiempo parcial',
  fines_de_semana: 'Fines de semana',
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  remis: 'Remis',
  taxi: 'Taxi',
  plataforma: 'Solo plataforma digital',
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

export const DRIVER_DOC_LABELS: Record<DriverDocType, { label: string; description: string; required: boolean }> = {
  licencia_conducir: {
    label: 'Licencia de conducir',
    description: 'Categoría habilitante para transporte de personas',
    required: true,
  },
  dni_frente: {
    label: 'DNI (frente)',
    description: 'Documento Nacional de Identidad — anverso',
    required: true,
  },
  dni_dorso: {
    label: 'DNI (dorso)',
    description: 'Documento Nacional de Identidad — reverso',
    required: true,
  },
  credencial_remis: {
    label: 'Credencial de remis',
    description: 'Credencial habilitante para conducir remis',
    required: false,
  },
  antecedentes_nacionales: {
    label: 'Antecedentes penales nacionales',
    description: 'Certificado del Registro Nacional de Reincidencia',
    required: true,
  },
  antecedentes_provinciales: {
    label: 'Antecedentes penales provinciales',
    description: 'Certificado de la provincia correspondiente',
    required: true,
  },
  seguro_excedentes: {
    label: 'Seguro de excedentes personales',
    description: 'Seguro para actividad de transporte de personas',
    required: true,
  },
}

export const VEHICLE_DOC_LABELS: Record<VehicleDocType, { label: string; description: string; required: boolean }> = {
  titulo_propiedad: {
    label: 'Título de propiedad',
    description: 'Escritura de titularidad del vehículo',
    required: true,
  },
  cedula_verde: {
    label: 'Cédula verde',
    description: 'Cédula de identificación del vehículo',
    required: true,
  },
  seguro_vehiculo: {
    label: 'Seguro del vehículo',
    description: 'Póliza de seguro vigente',
    required: true,
  },
  habilitacion_remis: {
    label: 'Habilitación remis',
    description: 'Habilitación municipal/provincial para servicio de remis',
    required: false,
  },
  habilitacion_taxi: {
    label: 'Habilitación taxi / licencia',
    description: 'Licencia de taxi o habilitación correspondiente',
    required: false,
  },
}

export const DAYS_OF_WEEK = [
  { value: 'lunes', label: 'Lun' },
  { value: 'martes', label: 'Mar' },
  { value: 'miercoles', label: 'Mié' },
  { value: 'jueves', label: 'Jue' },
  { value: 'viernes', label: 'Vie' },
  { value: 'sabado', label: 'Sáb' },
  { value: 'domingo', label: 'Dom' },
]

export type TicketCategory = 'falla_tecnica' | 'cambio_datos' | 'disputa' | 'pago' | 'otro'
export type TicketStatus = 'abierto' | 'en_revision' | 'resuelto' | 'cerrado'

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  message: string
  category: TicketCategory
  status: TicketStatus
  admin_response?: string
  created_at: string
  updated_at: string
  user?: Profile
}

export interface Rating {
  id: string
  from_user_id: string
  to_user_id: string
  rating: number
  comment?: string
  vehicle_id?: string
  created_at: string
  from_user?: Profile
  to_user?: Profile
  vehicle?: Vehicle
}

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  falla_tecnica: 'Falla técnica',
  cambio_datos: 'Cambio de datos',
  disputa: 'Disputa',
  pago: 'Pagos y suscripción',
  otro: 'Otro',
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  abierto: 'Abierto',
  en_revision: 'En revisión',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

// ─── Advertising ────────────────────────────────────────────────────────────

export type AdStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'finished' | 'rejected'
export type AdvertiserStatus = 'pending' | 'active' | 'suspended'

export interface Advertiser {
  id: string
  user_id: string
  company_name: string
  contact_email: string
  phone?: string
  website?: string
  status: AdvertiserStatus
  created_at: string
}

export interface Ad {
  id: string
  advertiser_id: string
  title: string
  description?: string
  image_url?: string
  target_url: string
  cta_text: string
  status: AdStatus
  starts_at?: string
  ends_at?: string
  max_impressions?: number
  current_impressions: number
  created_at: string
  updated_at: string
  advertiser?: Advertiser
}

export const AD_STATUS_LABELS: Record<AdStatus, string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  active: 'Activo',
  paused: 'Pausado',
  finished: 'Finalizado',
  rejected: 'Rechazado',
}

export const AD_STATUS_COLORS: Record<AdStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-blue-100 text-blue-600',
  finished: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-100 text-red-600',
}

// ─────────────────────────────────────────────────────────────────────────────

export const LEGAL_DISCLAIMER = `ACUERDO DE ALQUILER DE VEHÍCULO — CLÁUSULA DE NO RELACIÓN LABORAL

El presente acuerdo constituye exclusivamente un contrato de alquiler de vehículo entre el PROPIETARIO y el CONDUCTOR (en adelante "las partes"). Las partes declaran expresamente que:

1. No existe entre ellas relación laboral, de dependencia, ni vínculo societario de ningún tipo.

2. El conductor actúa como trabajador autónomo e independiente, siendo responsable del pago de sus propios impuestos, aportes y contribuciones previsionales.

3. El propietario no imparte órdenes ni instrucciones sobre la forma en que el conductor presta el servicio a través de las plataformas digitales.

4. El conductor asume la total responsabilidad por el uso del vehículo alquilado, incluyendo infracciones de tránsito, multas y daños a terceros no cubiertos por el seguro.

5. El pago pactado constituye el canon de alquiler del vehículo, no una remuneración laboral.

Al aceptar este acuerdo, ambas partes confirman haber leído, entendido y aceptado estas condiciones de manera voluntaria.`
