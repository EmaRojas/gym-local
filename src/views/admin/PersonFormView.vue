<template>
  <div class="flex items-center gap-3 mb-5">
    <button @click="$emit('cancel')" class="btn-icon bg-gym-gray-100" aria-label="Volver">
      <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
    </button>
    <div class="min-w-0">
      <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">{{ form.id ? 'Editar persona' : 'Nueva persona' }}</h1>
      <p class="text-sm text-gym-gray-500 mt-0.5">Completá los datos del alumno</p>
    </div>
  </div>

  <div class="card p-5 space-y-5">
    <div>
      <label for="person-name" class="label-field">Nombre *</label>
      <input id="person-name" v-model="form.name" type="text" class="input-field" :class="submitted && !form.name.trim() ? 'border-red-400 bg-red-50' : ''" placeholder="Nombre" autocomplete="given-name" />
      <p v-if="submitted && !form.name.trim()" class="error-text" role="alert">
        <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Dato obligatorio
      </p>
    </div>
    <div>
      <label for="person-lastname" class="label-field">Apellido *</label>
      <input id="person-lastname" v-model="form.lastName" type="text" class="input-field" :class="submitted && !form.lastName.trim() ? 'border-red-400 bg-red-50' : ''" placeholder="Apellido" autocomplete="family-name" />
      <p v-if="submitted && !form.lastName.trim()" class="error-text" role="alert">
        <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Dato obligatorio
      </p>
    </div>
    <div>
      <label for="person-dni" class="label-field">DNI *</label>
      <input
        id="person-dni"
        v-model="form.dni"
        type="text"
        inputmode="numeric"
        class="input-field"
        :class="submitted && (!form.dni.trim() || isDuplicate) ? 'border-red-400 bg-red-50' : ''"
        placeholder="12345678"
        maxlength="10"
        @input="form.dni = form.dni.replace(/[^0-9]/g, '')"
        autocomplete="off"
      />
      <p v-if="submitted && !form.dni.trim()" class="error-text" role="alert">
        <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Dato obligatorio
      </p>
      <p v-else-if="submitted && isDuplicate" class="error-text" role="alert">
        <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Ya existe una persona con ese DNI
      </p>
    </div>
    <div>
      <label for="person-address" class="label-field">Dirección <span class="font-normal text-gym-gray-400">(opcional)</span></label>
      <input id="person-address" v-model="form.address" type="text" class="input-field" placeholder="Calle 123" autocomplete="street-address" />
    </div>
    <div>
      <label for="person-phone" class="label-field">Teléfono <span class="font-normal text-gym-gray-400">(opcional)</span></label>
      <input id="person-phone" v-model="form.phone" type="tel" class="input-field" placeholder="11-1234-5678" autocomplete="tel" />
    </div>
  </div>

  <div v-if="error" class="mt-4 text-sm text-red-500 text-center">{{ error }}</div>
  <div class="mt-6 safe-bottom">
    <button @click="save" :disabled="saving" class="btn-primary w-full">
      {{ saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear persona' }}
    </button>
  </div>
</template>

<script lang="ts">
import pb from '../../db/pocketbase'
import { useAdminStore } from '../../stores/admin'
import type { Person } from '../../types'

export default {
  name: 'PersonFormView',
  props: {
    personData: { type: Object, default: () => ({ id: null, name: '', lastName: '', dni: '', address: '', phone: '' }) },
    allPersons: { type: Array as () => Person[], default: () => [] }
  },
  emits: ['saved', 'cancel'],
  data() {
    return {
      form: {
        id: (this.personData as any).id || null,
        name: (this.personData as any).name || '',
        lastName: (this.personData as any).lastName || '',
        dni: (this.personData as any).dni || '',
        address: (this.personData as any).address || '',
        phone: (this.personData as any).phone || ''
      },
      submitted: false,
      error: '',
      saving: false
    }
  },
  computed: {
    adminStore() { return useAdminStore() },
    isDuplicate(): boolean {
      if (!this.form.dni.trim()) return false
      return (this.allPersons as Person[]).some(p => p.dni === this.form.dni.trim() && p.id !== this.form.id)
    },
    isValid(): boolean {
      return !!(this.form.name.trim() && this.form.lastName.trim() && this.form.dni.trim()) && !this.isDuplicate
    }
  },
  methods: {
    async save() {
      this.submitted = true
      if (!this.isValid) return
      this.saving = true
      try {
        const { id, ...rest } = this.form
        if (id) {
          await pb.collection('persons').update(id, {
            ...rest, adminId: this.adminStore.adminId
          })
        } else {
          const record = await pb.collection('persons').create({
            ...rest, adminId: this.adminStore.adminId
          })
          this.form.id = record.id
        }
        this.$emit('saved', { id: this.form.id })
      } catch (e: any) {
        console.error(e)
        this.error = e?.response?.message || e?.message || 'Error al guardar'
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
