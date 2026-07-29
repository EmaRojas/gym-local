export interface Person {
  firebaseId?: string
  name: string
  lastName: string
  dni: string
  address?: string
  phone?: string
  adminId?: string
  createdAt?: string
  updatedAt?: string
}

export interface ExerciseSet {
  weight: number | null
  reps: number | null
}

export interface ExercisePlanEntry {
  name?: string
  muscleGroup?: string
  category?: string
  target?: string
  equipment?: string
  gifUrl?: string
  image?: string
  videoBase64?: string
  instructions?: { es?: string }
  sets: ExerciseSet[]
  fromDataset?: boolean
  datasetId?: string
  isCustom?: boolean
}

export interface Plan {
  firebaseId?: string
  personId: string
  adminId?: string
  name: string
  exercises: ExercisePlanEntry[]
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
  person?: {
    firebaseId: string
    adminId: string
    dni: string
    name: string
    lastName: string
    address?: string
    phone?: string
  }
}

export interface Exercise {
  id: string
  name: string
  category: string
  equipment: string
  target: string
  muscleGroup: string
  gifUrl?: string
  image?: string
  instructions?: Record<string, string>
  instructionSteps?: Record<string, string[]>
  secondaryMuscles?: string[]
  mediaId?: string
  attribution?: string
  createdAt?: string
  isCustom?: boolean
  adminId?: string | null
  videoBase64?: string | null
}
