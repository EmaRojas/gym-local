import { defineStore } from 'pinia'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import dbFirebase from '../db/firebase'
import db from '../db'
import type { Persona, Plan, GymInfo } from '../types'

const SESSION_KEY = 'alumno_session'

function sanitize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

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
        return await this._loginOffline(dni)
      } finally {
        this.loading = false
      }
    },

    async _loginOffline(dni: string): Promise<boolean | 'seleccionar-gym'> {
      const locales = await db.personas.where('dni').equals(dni).toArray()
      if (locales.length === 0) {
        this.error = 'Sin conexión. No se encontró el DNI localmente.'
        return false
      }

      const adminIds = [...new Set(locales.map(p => p.adminId).filter(Boolean))] as string[]
      if (adminIds.length > 1) {
        this.gymsDisponibles = adminIds.map(adminId => ({
          adminId,
          name: 'Gimnasio',
          persona: locales.find(p => p.adminId === adminId)!
        }))
        return 'seleccionar-gym'
      }

      const local = locales[0]
      const planesLocal = await db.planes.where('personaId').equals(local.id!).toArray()
      if (planesLocal.length === 0) {
        this.error = 'Sin conexión. No hay planes guardados localmente.'
        return false
      }
      this.persona = local
      this.planes = planesLocal
      this.logueado = true
      if (local.adminId) {
        this.gymSeleccionado = { adminId: local.adminId, name: 'Gimnasio' }
        await this._fetchGymName(local.adminId)
      }
      this._guardarSesion(dni)
      return true
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

      const locales = await db.personas.where('dni').equals(dni).toArray()
      let localPersonaId: number

      if (locales.length > 0) {
        localPersonaId = locales[0].id!
        await db.personas.update(localPersonaId, { firebaseId, adminId: (fd.adminId as string) || '' })
      } else {
        localPersonaId = await db.personas.add(sanitize({
          nombre: fd.nombre as string,
          apellido: fd.apellido as string,
          dni: fd.dni as string,
          direccion: (fd.direccion as string) || '',
          telefono: (fd.telefono as string) || '',
          firebaseId,
          adminId: (fd.adminId as string) || ''
        }))
      }

      this.persona = { id: localPersonaId, firebaseId, nombre: fd.nombre as string, apellido: fd.apellido as string, dni: fd.dni as string, direccion: (fd.direccion as string) || '', telefono: (fd.telefono as string) || '', adminId: (fd.adminId as string) || '' } as Persona

      const existentes = await db.planes.where('personaId').equals(localPersonaId).toArray()
      for (const p of existentes) {
        await db.planes.delete(p.id!)
      }

      const adminIdVal = (fd.adminId as string) || ''
      const planesQ = query(collection(dbFirebase, 'planes'), where('adminId', '==', adminIdVal))
      const planesSnapshot = await getDocs(planesQ)

      this.planes = []
      for (const planDoc of planesSnapshot.docs) {
        const planData = planDoc.data()
        const planPersonaId = String(planData.personaId || '')
        if (planPersonaId !== firebaseId) continue
        await db.planes.add(sanitize({
          firebaseId: planDoc.id,
          nombre: planData.nombre,
          exercises: planData.exercises || [],
          personaId: localPersonaId,
          adminId: adminIdVal,
          createdAt: planData.createdAt || new Date().toISOString(),
          updatedAt: planData.updatedAt || null
        }))
        this.planes.push({ ...planData, id: 0, firebaseId: planDoc.id } as Plan)
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

    async sincronizar(): Promise<void> {
      if (!this.persona) return
      this.loading = true
      this.error = null
      if (!navigator.onLine) {
        this.error = 'Sin conexión a internet. Los cambios se guardarán localmente.'
        this.loading = false
        return
      }
      try {
        const dni = this.persona.dni
        const adminId = this.persona.adminId
        const localPersonaId = this.persona.id

        let q
        if (adminId) {
          q = query(collection(dbFirebase, 'personas'), where('dni', '==', dni), where('adminId', '==', adminId))
        } else {
          q = query(collection(dbFirebase, 'personas'), where('dni', '==', dni))
        }
        const snapshot = await getDocs(q)
        if (snapshot.empty) return

        const personaDoc = snapshot.docs[0]
        const firebaseData = personaDoc.data()
        const firebaseId = personaDoc.id

        await db.personas.update(localPersonaId!, sanitize({
          nombre: firebaseData.nombre,
          apellido: firebaseData.apellido,
          dni: firebaseData.dni,
          direccion: firebaseData.direccion || '',
          telefono: firebaseData.telefono || '',
          adminId: firebaseData.adminId || adminId,
          firebaseId
        }))

        const { id: _fid, ...restFb } = firebaseData
        this.persona = { id: localPersonaId, ...restFb, firebaseId } as Persona

        const existentes = await db.planes.where('personaId').equals(localPersonaId!).toArray()
        for (const p of existentes) {
          await db.planes.delete(p.id!)
        }

        const adminIdVal = this.persona.adminId || ''
        const planesQ = query(collection(dbFirebase, 'planes'), where('adminId', '==', adminIdVal))
        const planesSnapshot = await getDocs(planesQ)

        this.planes = []
        for (const planDoc of planesSnapshot.docs) {
          const planData = planDoc.data()
          const planPersonaId = String(planData.personaId || '')
          if (planPersonaId !== firebaseId) continue
          await db.planes.add(sanitize({
            firebaseId: planDoc.id,
            nombre: planData.nombre,
            exercises: planData.exercises || [],
            personaId: localPersonaId as number,
            adminId: adminIdVal,
            createdAt: planData.createdAt || new Date().toISOString(),
            updatedAt: planData.updatedAt || null
          }))
          this.planes.push({ ...planData, id: 0, firebaseId: planDoc.id } as Plan)
        }
      } catch (e) {
        this.error = (e as Error).message || 'Error de conexión'
        console.error('Error sincronizando alumno:', e)
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
