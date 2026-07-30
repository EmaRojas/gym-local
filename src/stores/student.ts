import { defineStore } from 'pinia'
import pb from '../db/pocketbase'
import type { GymInfo } from '../types'

const SESSION_KEY = 'student_session'

interface StudentState {
  isLoggedIn: boolean
  loading: boolean
  error: string | null
  _savedDni: string | null
}

type PersonResult = {
  id: string
  adminId: string
  dni: string
  name: string
  lastName: string
  address?: string
  phone?: string
}

type LoginOk = { ok: true; person: PersonResult; gymSeleccionado: { adminId: string; name: string; logo?: string } }
type LoginMulti = { ok: false; gyms: GymInfo[] }
type LoginResult = LoginOk | LoginMulti | 'error'

export const useStudentStore = defineStore('student', {
  state: (): StudentState => ({
    isLoggedIn: false,
    loading: false,
    error: null,
    _savedDni: null
  }),

  actions: {
    async _fetchPersons(dni: string) {
      const records = await pb.collection('persons').getFullList({
        filter: `dni = "${dni}"`
      })
      if (!records.length) return null
      return records.map(r => ({
        id: r.id,
        data: r as unknown as Record<string, unknown>
      }))
    },

    async _fetchGymInfo(adminId: string) {
      try {
        const record = await pb.collection('admins').getOne(adminId)
        return { adminId, name: record.name || record.username || 'Gimnasio', logo: record.logo || '' }
      } catch {
        return { adminId, name: 'Gimnasio', logo: '' }
      }
    },

    async _buildGym(person: { id: string; data: Record<string, unknown> }, adminId: string): Promise<LoginOk['gymSeleccionado']> {
      try {
        const record = await pb.collection('admins').getOne(adminId)
        return { adminId, name: record.name || record.username || 'Gimnasio', logo: record.logo || '' }
      } catch {
        return { adminId, name: 'Gimnasio', logo: '' }
      }
    },

    async login(dni: string, adminId?: string): Promise<LoginResult | null> {
      this.loading = true
      this.error = null
      this._savedDni = dni
      try {
        const persons = await this._fetchPersons(dni)
        if (!persons) {
          this.error = 'DNI no encontrado'
          return 'error'
        }

        const adminIds = [...new Set(persons.map(p => p.data.adminId).filter(Boolean))] as string[]

        if (adminId) {
          const person = persons.find(p => p.data.adminId === adminId)
          if (!person) {
            this.error = 'Persona no encontrada'
            return 'error'
          }
          const gym = await this._fetchGymInfo(adminId)
          this.isLoggedIn = true
          this._saveSession(dni, gym)
          return { ok: true, person: { id: person.id, ...person.data } as unknown as PersonResult, gymSeleccionado: gym }
        }

        if (adminIds.length > 1) {
          const gyms: GymInfo[] = []
          for (const id of adminIds) {
            const gym = await this._fetchGymInfo(id)
            const person = persons.find(p => p.data.adminId === id)!
            gyms.push({ ...gym, person: { id: person.id, ...person.data } as unknown as PersonResult })
          }
          return { ok: false, gyms }
        }

        const singleAdminId = adminIds[0]
        const person = persons[0]
        const gym = singleAdminId ? await this._fetchGymInfo(singleAdminId) : { adminId: '', name: 'Gimnasio', logo: '' }
        this.isLoggedIn = true
        this._saveSession(dni, gym)
        return { ok: true, person: { id: person.id, ...person.data } as unknown as PersonResult, gymSeleccionado: gym }
      } catch (e) {
        console.error('Error login alumno:', e)
        this.error = 'Error de conexión. Revisá tu internet.'
        return 'error'
      } finally {
        this.loading = false
      }
    },

    async switchGym(): Promise<{ gyms: GymInfo[] } | null> {
      const dni = this._savedDni
      if (!dni) return null
      this.loading = true
      this.error = null
      try {
        const persons = await this._fetchPersons(dni)
        if (!persons) return null

        const adminIds = [...new Set(persons.map(p => p.data.adminId).filter(Boolean))] as string[]
        const gyms: GymInfo[] = []
        for (const id of adminIds) {
          const gym = await this._fetchGymInfo(id)
          const person = persons.find(p => p.data.adminId === id)!
          gyms.push({ ...gym, person: { id: person.id, ...person.data } as unknown as PersonResult })
        }
        localStorage.removeItem(SESSION_KEY)
        this.isLoggedIn = false
        return { gyms }
      } catch (e) {
        console.error('Error cambiando gym:', e)
        this.error = 'Error al buscar gimnasios'
        return null
      } finally {
        this.loading = false
      }
    },

    async restoreSession(): Promise<LoginResult | null> {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return null
      this.loading = true
      try {
        const parsed = JSON.parse(raw)
        this._savedDni = parsed.dni
        return await this.login(parsed.dni, parsed.adminId || undefined)
      } catch { return null }
      finally { this.loading = false }
    },

    _saveSession(dni: string, gym?: { adminId: string; name: string; logo?: string }): void {
      this._savedDni = dni
      const data: any = { dni }
      if (gym) { data.adminId = gym.adminId; data.name = gym.name; data.logo = gym.logo || null }
      localStorage.setItem(SESSION_KEY, JSON.stringify(data))
    },

    logout(): void {
      this.isLoggedIn = false
      this.error = null
      localStorage.removeItem(SESSION_KEY)
    }
  }
})