import { defineStore } from 'pinia'
import pb from '../db/pocketbase'
import type { Admin } from '../types'

interface AdminState {
  admin: Admin | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
}

export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    admin: null,
    isLoggedIn: false,
    loading: false,
    error: null
  }),

  getters: {
    adminId: (state: AdminState): string | null => state.admin?.id || null,
    adminName: (state: AdminState): string => state.admin?.name || state.admin?.username || 'Admin'
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      this.loading = true
      this.error = null
      try {
        await pb.collection('admins').authWithPassword(email, password)
        const record = pb.authStore.record
        if (!record) {
          this.error = 'Email o contraseña incorrecta'
          return false
        }
        this.admin = { id: record.id, email: record.email, username: record.username, name: record.name, logo: record.logo } as Admin
        this.isLoggedIn = true
        return true
      } catch (e: any) {
        console.error('Error login admin:', e)
        if (e.status === 400) {
          this.error = 'Email o contraseña incorrecta'
        } else {
          this.error = 'Error al iniciar sesión'
        }
        return false
      } finally {
        this.loading = false
      }
    },

    async restoreSession(): Promise<boolean> {
      try {
        const record = pb.authStore.record
        if (!pb.authStore.isValid || !record) {
          this.admin = null
          this.isLoggedIn = false
          return false
        }
        // Verify token is still valid
        try {
          await pb.collection('admins').authRefresh()
        } catch {
          pb.authStore.clear()
          this.admin = null
          this.isLoggedIn = false
          return false
        }
        this.admin = { id: record.id, email: record.email, username: record.username, name: record.name, logo: record.logo } as Admin
        this.isLoggedIn = true
        return true
      } catch {
        this.admin = null
        this.isLoggedIn = false
        return false
      }
    },

    async logout(): Promise<void> {
      pb.authStore.clear()
      this.admin = null
      this.isLoggedIn = false
      this.error = null
    }
  }
})
