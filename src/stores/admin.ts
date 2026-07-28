import { defineStore } from 'pinia'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import dbFirebase from '../db/firebase'
import type { Admin } from '../types'

const ADMIN_KEY = 'admin_session'

interface AdminState {
  admin: Admin | null
  logueado: boolean
  loading: boolean
  error: string | null
}

export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    admin: null,
    logueado: false,
    loading: false,
    error: null
  }),

  getters: {
    adminId: (state: AdminState): string | null => state.admin?.id || null,
    nombreAdmin: (state: AdminState): string => state.admin?.name || state.admin?.username || 'Admin'
  },

  actions: {
    async login(username: string, password: string): Promise<boolean> {
      this.loading = true
      this.error = null
      try {
        const q = query(
          collection(dbFirebase, 'admins'),
          where('username', '==', username),
          where('password', '==', password)
        )
        const snapshot = await getDocs(q)
        if (snapshot.empty) {
          this.error = 'Usuario o contraseña incorrecta'
          return false
        }
        const docSnap = snapshot.docs[0]
        this.admin = { id: docSnap.id, ...docSnap.data() } as Admin
        this.logueado = true
        localStorage.setItem(ADMIN_KEY, JSON.stringify({ id: docSnap.id, username: docSnap.data().username, name: docSnap.data().name || '', logo: docSnap.data().logo || '' }))
        return true
      } catch (e) {
        console.error('Error login admin:', e)
        this.error = 'Error al iniciar sesión'
        return false
      } finally {
        this.loading = false
      }
    },

    async restaurarSesion(): Promise<boolean> {
      const data = localStorage.getItem(ADMIN_KEY)
      if (!data) return false
      try {
        const parsed = JSON.parse(data)
        const docRef = doc(dbFirebase, 'admins', parsed.id)
        const docSnap = await getDoc(docRef)
        if (!docSnap.exists()) {
          localStorage.removeItem(ADMIN_KEY)
          return false
        }
        this.admin = { id: parsed.id, ...docSnap.data() } as Admin
        this.logueado = true
        return true
      } catch {
        return false
      }
    },

    logout(): void {
      this.admin = null
      this.logueado = false
      this.error = null
      localStorage.removeItem(ADMIN_KEY)
    }
  }
})
