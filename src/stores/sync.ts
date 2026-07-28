import { defineStore } from 'pinia'
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore'
import dbFirebase from '../db/firebase'
import db from '../db'
import type { Persona, Plan } from '../types'

interface SyncState {
  syncing: boolean
  lastSync: string | null
  error: string | null
}

export const useSyncStore = defineStore('sync', {
  state: (): SyncState => ({
    syncing: false,
    lastSync: null,
    error: null
  }),

  actions: {
    async syncAdmin(adminId: string): Promise<void> {
      this.syncing = true
      this.error = null
      if (!navigator.onLine) {
        this.error = 'Sin conexión a internet. Los cambios se sincronizarán cuando vuelva la conexión.'
        this.syncing = false
        return
      }
      try {
        await this._uploadDirty(adminId)
        await this._downloadFromFirebase(adminId)
        this.lastSync = new Date().toLocaleString('es-AR')
      } catch (e) {
        this.error = (e as Error).message
        console.error('Error sync admin:', e)
      } finally {
        this.syncing = false
      }
    },

    async _uploadDirty(adminId: string): Promise<void> {
      const dirtyPersonas = await db.personas.where('adminId').equals(adminId).toArray()
      for (const persona of dirtyPersonas) {
        if (persona.dirty) {
          await this._uploadPersona(persona)
        }
      }

      const dirtyPlanes = await db.planes.where('adminId').equals(adminId).toArray()
      for (const plan of dirtyPlanes) {
        if (plan.dirty) {
          await this._uploadPlan(plan)
        }
      }
    },

    async _uploadPersona(persona: Persona): Promise<void> {
      const data = JSON.parse(JSON.stringify({
        nombre: persona.nombre,
        apellido: persona.apellido,
        dni: persona.dni,
        direccion: persona.direccion || '',
        telefono: persona.telefono || '',
        adminId: persona.adminId || '',
        createdAt: persona.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      if (persona.firebaseId) {
        await setDoc(doc(dbFirebase, 'personas', persona.firebaseId), data)
      } else {
        const ref = doc(collection(dbFirebase, 'personas'))
        await setDoc(ref, data)
        if (persona.id) {
          await db.personas.update(persona.id, { firebaseId: ref.id, dirty: false })
        }
        return
      }
      if (persona.id) {
        await db.personas.update(persona.id, { dirty: false })
      }
    },

    async _uploadPlan(plan: Plan): Promise<void> {
      const persona = await db.personas.where('id').equals(plan.personaId).first()
      const firebasePersonaId = persona?.firebaseId || String(plan.personaId)

      const data = JSON.parse(JSON.stringify({
        nombre: plan.nombre,
        exercises: plan.exercises || [],
        personaId: firebasePersonaId,
        adminId: plan.adminId || '',
        createdAt: plan.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      if (plan.firebaseId) {
        await setDoc(doc(dbFirebase, 'planes', plan.firebaseId), data)
      } else {
        const ref = doc(collection(dbFirebase, 'planes'))
        await setDoc(ref, data)
        if (plan.id) {
          await db.planes.update(plan.id, { firebaseId: ref.id, dirty: false })
        }
        return
      }
      if (plan.id) {
        await db.planes.update(plan.id, { dirty: false })
      }
    },

    async _downloadFromFirebase(adminId: string): Promise<void> {
      const qPersonas = query(collection(dbFirebase, 'personas'), where('adminId', '==', adminId))
      const personasSnapshot = await getDocs(qPersonas)

      const mapaFbADexie: Record<string, number> = {}

      for (const docSnap of personasSnapshot.docs) {
        const fb = docSnap.data()
        const existente = await db.personas.where('firebaseId').equals(docSnap.id).first()

        if (existente) {
          await db.personas.update(existente.id!, {
            nombre: fb.nombre,
            apellido: fb.apellido,
            dni: fb.dni,
            direccion: fb.direccion || '',
            telefono: fb.telefono || '',
            adminId: fb.adminId || adminId,
            dirty: false
          })
          mapaFbADexie[docSnap.id] = existente.id!
        } else {
          const localId = await db.personas.add(JSON.parse(JSON.stringify({
            nombre: fb.nombre,
            apellido: fb.apellido,
            dni: fb.dni,
            direccion: fb.direccion || '',
            telefono: fb.telefono || '',
            firebaseId: docSnap.id,
            adminId: fb.adminId || adminId,
            dirty: false
          })))
          mapaFbADexie[docSnap.id] = localId
        }
      }

      const localPersonas = await db.personas.where('adminId').equals(adminId).toArray()
      const firebaseIds = new Set(personasSnapshot.docs.map(d => d.id))
      const firebaseDnis = new Set(personasSnapshot.docs.map(d => d.data().dni))
      for (const local of localPersonas) {
        if (local.dirty) continue
        if (local.firebaseId && !firebaseIds.has(local.firebaseId)) {
          const planes = await db.planes.where('personaId').equals(local.id!).toArray()
          for (const plan of planes) await db.planes.delete(plan.id!)
          await db.personas.delete(local.id!)
        } else if (!local.firebaseId && !firebaseDnis.has(local.dni)) {
          const planes = await db.planes.where('personaId').equals(local.id!).toArray()
          for (const plan of planes) await db.planes.delete(plan.id!)
          await db.personas.delete(local.id!)
        }
      }

      const qPlanes = query(collection(dbFirebase, 'planes'), where('adminId', '==', adminId))
      const planesSnapshot = await getDocs(qPlanes)

      const firebasePlanIds = new Set<string>()

      for (const planDoc of planesSnapshot.docs) {
        const fbPlan = planDoc.data()
        firebasePlanIds.add(planDoc.id)

        const persona = await db.personas.where('firebaseId').equals(
          String(fbPlan.personaId)
        ).first()

        if (!persona) continue

        const existente = await db.planes.where('firebaseId').equals(planDoc.id).first()

        if (existente) {
          await db.planes.update(existente.id!, {
            nombre: fbPlan.nombre,
            exercises: fbPlan.exercises || [],
            personaId: persona.id!,
            adminId,
            dirty: false,
            updatedAt: fbPlan.updatedAt || null
          })
        } else {
          await db.planes.add(JSON.parse(JSON.stringify({
            firebaseId: planDoc.id,
            nombre: fbPlan.nombre,
            exercises: fbPlan.exercises || [],
            personaId: persona.id!,
            adminId,
            dirty: false,
            createdAt: fbPlan.createdAt || new Date().toISOString(),
            updatedAt: fbPlan.updatedAt || null
          })))
        }
      }

      const localPlanes = await db.planes.where('adminId').equals(adminId).toArray()
      for (const local of localPlanes) {
        if (local.dirty) continue
        if (local.firebaseId && !firebasePlanIds.has(local.firebaseId)) {
          await db.planes.delete(local.id!)
        } else if (!local.firebaseId) {
          await db.planes.delete(local.id!)
        }
      }
    }
  }
})
