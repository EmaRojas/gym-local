export interface Persona {
  id?: number
  nombre: string
  apellido: string
  dni: string
  direccion?: string
  telefono?: string
  firebaseId?: string
  adminId?: string
  dirty?: boolean
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
  instructions?: { es?: string }
  sets: EjercicioSet[]
  fromDataset?: boolean
  datasetId?: string
  name?: string
  equipment?: string
  muscle_group?: string
}

export interface Plan {
  id?: number
  firebaseId?: string
  personaId: number
  adminId?: string
  nombre: string
  exercises: EjercicioPlan[]
  dirty?: boolean
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
  instructions?: { es?: string }
}
