import Dexie, { type Table } from 'dexie'
import type { Persona, Plan } from '../types'

const db = new Dexie('GymDB')

db.version(1).stores({
  user: '++id, nombre',
  workouts: '++id, routineId, completedAt',
  routines: '++id, nombre',
  exercises: '++id, nombre, grupoMuscular'
})

db.version(2).stores({
  personas: '++id, dni, nombre, apellido, adminId',
  planes: '++id, personaId, nombre, adminId'
})

db.version(3).stores({
  personas: '++id, dni, nombre, apellido, adminId, dirty',
  planes: '++id, personaId, nombre, adminId, dirty'
})

db.version(4).stores({
  personas: '++id, dni, nombre, apellido, adminId, dirty, firebaseId',
  planes: '++id, personaId, nombre, adminId, dirty, firebaseId'
})

export interface GymDB {
  personas: Table<Persona>
  planes: Table<Plan>
}

export default db as Dexie & GymDB
