import { defineStore } from 'pinia'
import db from '../db'
import type { Persona, Plan } from '../types'

interface PersonasState {
  personas: Persona[]
  planes: Plan[]
  loading: boolean
}

export const usePersonasStore = defineStore('personas', {
  state: (): PersonasState => ({
    personas: [],
    planes: [],
    loading: false
  }),

  getters: {
    personasOrdenadas: (state: PersonasState): Persona[] => {
      return [...state.personas].sort((a, b) => {
        const nombreA = (a.apellido || '') + (a.nombre || '')
        const nombreB = (b.apellido || '') + (b.nombre || '')
        return nombreA.localeCompare(nombreB)
      })
    },

    planesDePersona: (state: PersonasState) => {
      return (personaId: number): Plan[] => state.planes.filter(p => p.personaId === personaId)
    },

    buscarPorDni: (state: PersonasState) => {
      return (dni: string): Persona | undefined => state.personas.find(p => p.dni === dni)
    }
  },

  actions: {
    async cargarPersonas(adminId?: string): Promise<void> {
      this.loading = true
      try {
        if (adminId) {
          this.personas = await db.personas.where('adminId').equals(adminId).toArray()
          this.planes = await db.planes.where('adminId').equals(adminId).toArray()
        } else {
          this.personas = await db.personas.toArray()
          this.planes = await db.planes.toArray()
        }
      } finally {
        this.loading = false
      }
    },

    async guardarPersona(persona: Persona): Promise<Persona> {
      const data = JSON.parse(JSON.stringify({
        ...persona,
        createdAt: persona.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
      if (persona.id) {
        await db.personas.put(data)
      } else {
        const id = await db.personas.add(data)
        data.id = id
      }
      await this.cargarPersonas()
      return data
    },

    async eliminarPersona(id: number): Promise<void> {
      await db.personas.delete(id)
      const planes = await db.planes.where('personaId').equals(id).toArray()
      for (const plan of planes) {
        await db.planes.delete(plan.id!)
      }
      await this.cargarPersonas()
    },

    async eliminarPlan(id: number): Promise<void> {
      await db.planes.delete(id)
      await this.cargarPersonas()
    }
  }
})
