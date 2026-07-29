export interface Persona {
  firebaseId?: string
  nombre: string
  apellido: string
  dni: string
  direccion?: string
  telefono?: string
  adminId?: string
  createdAt?: string
  updatedAt?: string
}

export interface EjercicioSet {
  peso: number | null
  reps: number | null
}

export interface EjercicioPlan {
  nombre: string
  grupoMuscular?: string
  category?: string
  target?: string
  equipo?: string
  gif_url?: string
  image?: string
  video_base64?: string
  instructions?: { es?: string }
  sets: EjercicioSet[]
  fromDataset?: boolean
  datasetId?: string
  name?: string
  equipment?: string
  muscle_group?: string
}

export interface Plan {
  firebaseId?: string
  personaId: string
  adminId?: string
  nombre: string
  exercises: EjercicioPlan[]
  createdAt?: string
  updatedAt?: string
}

export interface Admin {
  id?: string
  username: string
  password?: string
  name?: string
  logo?: string
}

export interface GymInfo {
  adminId: string
  name: string
  logo?: string
  persona?: {
    firebaseId: string
    data: Record<string, any>
  }
}

export interface Exercise {
  id: string
  name: string
  category: string
  equipment: string
  target: string
  muscle_group: string
  gif_url?: string
  image?: string
  instructions?: Record<string, string>
  instruction_steps?: Record<string, string[]>
  secondary_muscles?: string[]
  media_id?: string
  attribution?: string
  created_at?: string
  es_personalizado?: boolean
  adminId?: string | null
  video_base64?: string | null
}
