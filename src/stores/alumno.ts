import { defineStore } from 'pinia'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import dbFirebase from '../db/firebase'
import type { Persona, Plan, GymInfo } from '../types'

const SESSION_KEY = 'alumno_session'

interface AlumnoState {
  persona: Persona | null
  planes: Plan[]
  logueado: boolean
  loading: boolean
  error: string | null
  gymsDisponibles: GymInfo[]
  gymSeleccionado: { adminId: string; name: string; logo?: string } | null
  _dniGuardado: string | null
}

export const useAlumnoStore = defineStore('alumno', {
  state: (): AlumnoState => ({
    persona: null,
    planes: [],
    logueado: false,
    loading: false,
    error: null,
    gymsDisponibles: [],
    gymSeleccionado: null,
    _dniGuardado: null
  }),

  getters: {
    nombreCompleto: (state: AlumnoState): string => {
      if (!state.persona) return 'Alumno'
      return `${state.persona.nombre || ''} ${state.persona.apellido || ''}`.trim() || 'Alumno'
    },
    nombreGym: (state: AlumnoState): string => {
      return state.gymSeleccionado?.name || 'Gimnasio'
    },
    logoGym: (state: AlumnoState): string => {
      return state.gymSeleccionado?.logo || ''
    }
  },

  actions: {
    async login(dni: string): Promise<boolean | 'seleccionar-gym'> {
      this.loading = true
      this.error = null
      this.gymsDisponibles = []
      this.gymSeleccionado = null
      this._dniGuardado = dni
      try {
        return await this._loginDesdeFirebase(dni)
      } catch (e) {
        console.error('Error login alumno:', e)
        this.error = 'Error de conexión. Revisá tu internet.'
        return false
      } finally {
        this.loading = false
      }
    },

    async _fetchGymName(adminId: string): Promise<string> {
      try {
        const adminDoc = await getDoc(doc(dbFirebase, 'admins', adminId))
        if (adminDoc.exists()) {
          const data = adminDoc.data()
          const name = data.name || data.username || 'Gimnasio'
          this.gymSeleccionado = { adminId, name, logo: data.logo || '' }
          return name
        }
      } catch { /* empty */ }
      return 'Gimnasio'
    },

    async _loginDesdeFirebase(dni: string): Promise<boolean | 'seleccionar-gym'> {
      const q = query(collection(dbFirebase, 'personas'), where('dni', '==', dni))
      const snapshot = await getDocs(q)
      if (snapshot.empty) {
        this.error = 'DNI no encontrado'
        return false
      }

      const personasEncontradas = snapshot.docs.map(d => ({
        firebaseId: d.id,
        data: d.data() as Record<string, unknown>
      }))

      const adminIds = [...new Set(personasEncontradas.map(p => p.data.adminId).filter(Boolean))] as string[]

      if (adminIds.length > 1) {
        const gymInfo: GymInfo[] = []
        for (const adminId of adminIds) {
          try {
            const adminDoc = await getDoc(doc(dbFirebase, 'admins', adminId))
            if (adminDoc.exists()) {
              const data = adminDoc.data()
              gymInfo.push({
                adminId,
                name: data.name || data.username || 'Gimnasio',
                logo: data.logo || ''
              })
            } else {
              gymInfo.push({ adminId, name: 'Gimnasio' })
            }
          } catch {
            gymInfo.push({ adminId, name: 'Gimnasio' })
          }
        }
        this.gymsDisponibles = gymInfo.map(g => ({
          ...g,
          persona: personasEncontradas.find(p => p.data.adminId === g.adminId)
        }))
        return 'seleccionar-gym'
      }

      const adminId = adminIds[0]
      if (adminId) {
        await this._fetchGymName(adminId)
      }

      return await this._cargarPersona(personasEncontradas[0], dni)
    },

    async seleccionarGym(gym: GymInfo): Promise<void> {
      this.gymSeleccionado = { adminId: gym.adminId, name: gym.name, logo: gym.logo }
      this.gymsDisponibles = []
      await this._cargarPersona(gym.persona!, this._dniGuardado!)
    },

    async cambiarGym(): Promise<'seleccionar-gym' | 'login'> {
      const dni = this._dniGuardado || this.persona?.dni
      if (!dni) return 'login'
      this.loading = true
      this.error = null
      this.persona = null
      this.planes = []
      this.logueado = false
      this.gymSeleccionado = null
      try {
        const q = query(collection(dbFirebase, 'personas'), where('dni', '==', dni))
        const snapshot = await getDocs(q)
        if (snapshot.empty) {
          this.error = 'DNI no encontrado'
          return 'login'
        }

        const personasEncontradas = snapshot.docs.map(d => ({
          firebaseId: d.id,
          data: d.data() as Record<string, unknown>
        }))

        const adminIds = [...new Set(personasEncontradas.map(p => p.data.adminId).filter(Boolean))] as string[]

        const gymInfo: GymInfo[] = []
        for (const adminId of adminIds) {
          try {
            const adminDoc = await getDoc(doc(dbFirebase, 'admins', adminId))
            if (adminDoc.exists()) {
              const data = adminDoc.data()
              gymInfo.push({
                adminId,
                name: data.name || data.username || 'Gimnasio',
                logo: data.logo || ''
              })
            } else {
              gymInfo.push({ adminId, name: 'Gimnasio' })
            }
          } catch {
            gymInfo.push({ adminId, name: 'Gimnasio' })
          }
        }
        this.gymsDisponibles = gymInfo.map(g => ({
          ...g,
          persona: personasEncontradas.find(p => p.data.adminId === g.adminId)
        }))
        localStorage.removeItem(SESSION_KEY)
        return 'seleccionar-gym'
      } catch (e) {
        console.error('Error cambiando gym:', e)
        this.error = 'Error al buscar gimnasios'
        return 'login'
      } finally {
        this.loading = false
      }
    },

    async _cargarPersona(personaEncontrada: { firebaseId: string; data: Record<string, unknown> }, dni: string): Promise<boolean> {
      const { firebaseId, data: fd } = personaEncontrada

      this.persona = { firebaseId, nombre: fd.nombre as string, apellido: fd.apellido as string, dni: fd.dni as string, direccion: (fd.direccion as string) || '', telefono: (fd.telefono as string) || '', adminId: (fd.adminId as string) || '' } as Persona

      const adminIdVal = (fd.adminId as string) || ''
      const planesQ = query(collection(dbFirebase, 'planes'), where('adminId', '==', adminIdVal))
      const planesSnapshot = await getDocs(planesQ)

      this.planes = []
      for (const planDoc of planesSnapshot.docs) {
        const planData = planDoc.data()
        const planPersonaId = String(planData.personaId || '')
        if (planPersonaId !== firebaseId) continue
        this.planes.push({ firebaseId: planDoc.id, ...planData } as Plan)
      }

      this.logueado = true
      this._guardarSesion(dni)
      return true
    },

    async restaurarSesion(): Promise<boolean | 'seleccionar-gym'> {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return false
      this.loading = true
      try {
        let dni: string
        let savedAdminId: string | null = null
        let savedName: string | null = null
        let savedLogo: string | null = null
        try {
          const parsed = JSON.parse(raw)
          dni = parsed.dni
          savedAdminId = parsed.adminId
          savedName = parsed.name
          savedLogo = parsed.logo
        } catch {
          dni = raw
        }
        this._dniGuardado = dni
        if (savedAdminId && savedName) {
          this.gymSeleccionado = { adminId: savedAdminId, name: savedName, logo: savedLogo || '' }
        }
        return await this.login(dni)
      } catch {
        return false
      } finally {
        this.loading = false
      }
    },

    _guardarSesion(dni: string): void {
      this._dniGuardado = dni
      const data = {
        dni,
        adminId: this.gymSeleccionado?.adminId || null,
        name: this.gymSeleccionado?.name || null,
        logo: this.gymSeleccionado?.logo || null
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(data))
    },

    logout(): void {
      this.persona = null
      this.planes = []
      this.logueado = false
      this.error = null
      this.gymsDisponibles = []
      this.gymSeleccionado = null
      localStorage.removeItem(SESSION_KEY)
    }
  }
})
