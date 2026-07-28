<template>
  <div>
    <!-- LOGIN ADMIN -->
    <LoginCard
      v-if="!logueado"
      titulo="Panel Admin"
      subtitulo="Ingresá tu usuario y contraseña"
      icono="ph:shield-check"
      icon-bg-class="bg-gym-gray-800"
      :error="loginError"
      :cargando="loginCargando"
      :disabled="!loginUser.trim() || !loginPass.trim()"
      texto-botones="Ingresar"
      texto-cargando="Entrando..."
      @submit="loginAdmin"
    >
      <div class="mb-4">
        <label for="admin-usuario" class="label-field">Usuario</label>
        <input id="admin-usuario" v-model="loginUser" type="text" class="input-field" placeholder="Usuario" @keyup.enter="loginAdmin" autocomplete="username" />
      </div>
      <div class="mb-2">
        <label for="admin-password" class="label-field">Contraseña</label>
        <input id="admin-password" v-model="loginPass" type="password" class="input-field" placeholder="Contraseña" @keyup.enter="loginAdmin" autocomplete="current-password" />
      </div>
    </LoginCard>

    <!-- PANEL ADMIN (requiere login) -->
    <template v-if="logueado">
    <!-- LISTA DE PERSONAS -->
    <template v-if="vista === 'lista'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="$router.push('/')" class="btn-icon bg-gym-gray-100" aria-label="Volver al inicio">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">Personas</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5 tabular-nums">{{ personas.length }} personas</p>
        </div>
        <button @click="logoutAdmin" class="btn-icon bg-gym-gray-200" aria-label="Cerrar sesión">
          <Icon icon="ph:sign-out" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <button @click="doSync" :disabled="syncStore.syncing" class="btn-icon bg-green-100" aria-label="Sincronizar">
          <Icon :icon="syncStore.syncing ? 'ph:spinner' : 'ph:arrows-clockwise'" class="w-5 h-5 text-green-600" :class="syncStore.syncing ? 'animate-spin' : ''" />
        </button>
      </div>

      <p v-if="syncStore.lastSync" class="text-xs text-green-600 mb-3">Última sync: {{ syncStore.lastSync }}</p>
      <div v-if="syncStore.error" class="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
        <Icon icon="ph:warning-circle" class="w-5 h-5 text-red-500 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-red-800">No se pudo sincronizar</p>
          <p class="text-xs text-red-600 mt-0.5">{{ syncStore.error }}</p>
        </div>
        <button @click="syncStore.error = ''" class="btn-icon-sm text-red-400 flex-shrink-0" aria-label="Cerrar error">
          <Icon icon="ph:x" class="w-5 h-5" />
        </button>
      </div>

      <button @click="nuevaPersona" class="card card-hover p-4 flex items-center gap-3.5 mb-4 w-full">
        <div class="w-12 h-12 bg-gym-blue rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon icon="ph:plus" class="w-6 h-6 text-white" />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <h3 class="font-bold text-gym-gray-900 leading-tight">Nueva persona</h3>
          <p class="text-xs text-gym-gray-500 mt-0.5">Cargá los datos de un alumno</p>
        </div>
        <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
      </button>

      <div class="mb-4">
        <label for="busqueda-personas" class="sr-only">Buscar personas</label>
        <input id="busqueda-personas" v-model="busqueda" type="text" class="input-field" placeholder="Buscar por nombre o DNI..." />
      </div>

      <EmptyState v-if="personasFiltradas.length === 0" icono="ph:users" titulo="No hay personas cargadas" />

      <div v-else class="space-y-3">
        <PersonaCard
          v-for="persona in personasFiltradas"
          :key="persona.id"
          :persona="persona"
          :plan-count="planesDe(persona.id!).length"
          @click="verPersona(persona)"
        />
      </div>
    </template>

      <!-- CREAR / EDITAR PERSONA -->
    <template v-if="vista === 'persona-form'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="vista = personaForm.id ? 'persona-detalle' : 'lista'" class="btn-icon bg-gym-gray-100" aria-label="Volver">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">{{ personaForm.id ? 'Editar persona' : 'Nueva persona' }}</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5">Completá los datos del alumno</p>
        </div>
      </div>

      <div class="card p-5 space-y-5">
        <div>
          <label for="persona-nombre" class="label-field">Nombre *</label>
          <input id="persona-nombre" v-model="personaForm.nombre" type="text" class="input-field" :class="personaEnviado && !personaForm.nombre.trim() ? 'border-red-400 bg-red-50' : ''" placeholder="Nombre" autocomplete="given-name" />
          <p v-if="personaEnviado && !personaForm.nombre.trim()" class="error-text" role="alert">
            <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Dato obligatorio
          </p>
        </div>
        <div>
          <label for="persona-apellido" class="label-field">Apellido *</label>
          <input id="persona-apellido" v-model="personaForm.apellido" type="text" class="input-field" :class="personaEnviado && !personaForm.apellido.trim() ? 'border-red-400 bg-red-50' : ''" placeholder="Apellido" autocomplete="family-name" />
          <p v-if="personaEnviado && !personaForm.apellido.trim()" class="error-text" role="alert">
            <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Dato obligatorio
          </p>
        </div>
        <div>
          <label for="persona-dni" class="label-field">DNI *</label>
          <input
            id="persona-dni"
            v-model="personaForm.dni"
            type="text"
            inputmode="numeric"
            class="input-field"
            :class="personaEnviado && (!personaForm.dni.trim() || dniDuplicado) ? 'border-red-400 bg-red-50' : ''"
            placeholder="12345678"
            maxlength="10"
            @input="personaForm.dni = personaForm.dni.replace(/[^0-9]/g, '')"
            autocomplete="off"
          />
          <p v-if="personaEnviado && !personaForm.dni.trim()" class="error-text" role="alert">
            <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Dato obligatorio
          </p>
          <p v-else-if="personaEnviado && dniDuplicado" class="error-text" role="alert">
            <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Ya existe una persona con ese DNI
          </p>
        </div>
        <div>
          <label for="persona-direccion" class="label-field">Dirección <span class="font-normal text-gym-gray-400">(opcional)</span></label>
          <input id="persona-direccion" v-model="personaForm.direccion" type="text" class="input-field" placeholder="Calle 123" autocomplete="street-address" />
        </div>
        <div>
          <label for="persona-telefono" class="label-field">Teléfono <span class="font-normal text-gym-gray-400">(opcional)</span></label>
          <input id="persona-telefono" v-model="personaForm.telefono" type="tel" class="input-field" placeholder="11-1234-5678" autocomplete="tel" />
        </div>
      </div>

      <div class="mt-6 safe-bottom">
        <button @click="guardarPersona" :disabled="guardando" class="btn-primary w-full">
          {{ guardando ? 'Guardando...' : personaForm.id ? 'Guardar cambios' : 'Crear persona' }}
        </button>
      </div>
    </template>

    <!-- DETALLE DE PERSONA + PLANES -->
    <template v-if="vista === 'persona-detalle'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="vista = 'lista'" class="btn-icon bg-gym-gray-100" aria-label="Volver a personas">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight truncate">{{ personaSel?.nombre }} {{ personaSel?.apellido }}</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5">DNI: {{ personaSel?.dni }}</p>
        </div>
        <button @click="mostrarConfirmPersona = true" class="btn-icon bg-red-50" :aria-label="`Eliminar a ${personaSel?.nombre}`">
          <Icon icon="ph:trash" class="w-5 h-5 text-red-500" />
        </button>
      </div>

      <div v-if="personaSel" class="card p-4 mb-5">
        <div class="space-y-2.5">
          <div v-if="personaSel.direccion" class="flex items-start gap-2.5">
            <Icon icon="ph:map-pin" class="w-4 h-4 text-gym-gray-400 mt-0.5 flex-shrink-0" />
            <span class="text-sm text-gym-gray-700">{{ personaSel.direccion }}</span>
          </div>
          <div v-if="personaSel.telefono" class="flex items-start gap-2.5">
            <Icon icon="ph:phone" class="w-4 h-4 text-gym-gray-400 mt-0.5 flex-shrink-0" />
            <span class="text-sm text-gym-gray-700">{{ personaSel.telefono }}</span>
          </div>
        </div>
        <button @click="editarPersona" class="btn-sm text-gym-blue flex items-center gap-1.5 mt-3">
          <Icon icon="ph:pencil" class="w-4 h-4" /> Editar datos
        </button>
      </div>

      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-gym-gray-900">Planes asignados</h2>
        <button @click="nuevoPlan" class="btn-sm text-gym-blue flex items-center gap-1.5">
          <Icon icon="ph:plus" class="w-4 h-4" /> Nuevo plan
        </button>
      </div>

      <EmptyState v-if="planesPersona.length === 0" icono="ph:list-checks" titulo="No tiene planes asignados" />

      <div v-else class="space-y-3">
        <PlanCard
          v-for="plan in planesPersona"
          :key="plan.id"
          :plan="plan"
          editable
          @edit="editarPlan"
          @delete="eliminarPlan"
        />
      </div>
    </template>

    <!-- CREAR / EDITAR PLAN -->
    <template v-if="vista === 'plan-form'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="vista = 'persona-detalle'" class="btn-icon bg-gym-gray-100" aria-label="Volver">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">{{ planForm.id ? 'Editar plan' : 'Nuevo plan' }}</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5 truncate">Para: {{ personaSel?.nombre }} {{ personaSel?.apellido }}</p>
        </div>
      </div>

      <div class="card p-5 mb-4">
        <label for="plan-nombre" class="label-field">Nombre del plan</label>
        <input id="plan-nombre" v-model="planForm.nombre" type="text" class="input-field" placeholder="Ej: Torso, Fuerza, etc." />
      </div>

      <button @click="mostrarBuscador = true" class="card card-hover p-4 flex items-center gap-3 mb-4 w-full">
        <div class="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon icon="ph:magnifying-glass" class="w-5 h-5 text-green-600" />
        </div>
        <div class="flex-1 text-left min-w-0">
          <span class="font-semibold text-gym-gray-700 leading-tight block">Buscar ejercicio del catálogo</span>
          <p class="text-xs text-gym-gray-500 mt-0.5 tabular-nums">{{ planForm.ejerciciosDataset.length }} seleccionados</p>
        </div>
        <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
      </button>

      <div v-if="planForm.ejerciciosDataset.length === 0 && planForm.ejerciciosManuales.length === 0" class="text-center text-sm text-gym-gray-400 mb-4 py-2">
        Agregá ejercicios del catálogo o manualmente
      </div>

      <div v-if="planForm.ejerciciosDataset.length > 0" class="mb-5">
        <h3 class="text-sm font-semibold text-gym-gray-700 mb-2.5">Del catálogo ({{ planForm.ejerciciosDataset.length }})</h3>
        <div class="space-y-3">
          <div v-for="(ej, i) in planForm.ejerciciosDataset" :key="ej.id" class="card p-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gym-gray-100">
                <img v-if="ej.gif_url" :src="getImgUrl(ej.gif_url)" :alt="ej.name" class="w-full h-full object-cover" />
                <Icon v-else icon="ph:barbell" class="w-5 h-5 text-gym-gray-400" />
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-semibold text-gym-gray-900 truncate leading-tight">{{ traducirNombre(ej.name) }}</h4>
                <p class="text-xs text-gym-gray-500 mt-0.5">{{ traducirCategoria(ej.category) }}</p>
              </div>
              <button @click="planForm.ejerciciosDataset.splice(i, 1)" class="btn-icon bg-gym-gray-100" :aria-label="`Quitar ${traducirNombre(ej.name)}`">
                <Icon icon="ph:x" class="w-5 h-5 text-gym-gray-400" />
              </button>
            </div>
            <div class="mt-3">
              <ExerciseSetEditor v-model="ej.sets" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="planForm.ejerciciosManuales.length > 0" class="mb-5">
        <h3 class="text-sm font-semibold text-gym-gray-700 mb-2.5">Manuales ({{ planForm.ejerciciosManuales.length }})</h3>
        <div class="space-y-3">
          <div v-for="(ej, i) in planForm.ejerciciosManuales" :key="i" class="card p-4">
            <div class="flex items-center gap-3 mb-3">
              <div class="flex-1">
                <label :for="`manual-nombre-${i}`" class="sr-only">Nombre del ejercicio manual</label>
                <input :id="`manual-nombre-${i}`" v-model="ej.nombre" type="text" class="input-field" placeholder="Nombre del ejercicio" />
              </div>
              <button @click="planForm.ejerciciosManuales.splice(i, 1)" class="btn-icon bg-gym-gray-100 flex-shrink-0" :aria-label="`Quitar ejercicio ${i + 1}`">
                <Icon icon="ph:x" class="w-5 h-5 text-gym-gray-400" />
              </button>
            </div>
            <div class="mb-3">
              <label :for="`manual-grupo-${i}`" class="sr-only">Grupo muscular</label>
              <input :id="`manual-grupo-${i}`" v-model="ej.grupoMuscular" type="text" class="input-field" placeholder="Grupo muscular" />
            </div>
            <ExerciseSetEditor v-model="ej.sets" />
          </div>
        </div>
      </div>

      <button @click="agregarManual" class="card card-hover p-4 flex items-center gap-3 mb-5 w-full">
        <div class="w-11 h-11 bg-gym-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon icon="ph:plus" class="w-5 h-5 text-gym-blue" />
        </div>
        <span class="font-semibold text-gym-gray-700">Agregar ejercicio manual</span>
      </button>

      <p v-if="!planValido && planEnviado" class="text-sm text-red-500 font-medium text-center mb-4" role="alert">{{ planMensajeValidacion }}</p>
      <p v-if="errorPlan" class="text-sm text-red-500 font-medium text-center mb-4" role="alert">{{ errorPlan }}</p>

      <div class="safe-bottom">
        <button @click="guardarPlan" :disabled="guardando || !planValido" class="btn-primary w-full mb-4">
          {{ guardando ? 'Guardando...' : planForm.id ? 'Guardar cambios' : 'Asignar plan' }}
        </button>
      </div>

      <!-- Modal buscador -->
      <div v-if="mostrarBuscador" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4" @keydown.escape="mostrarBuscador = false" role="dialog" aria-modal="true" aria-label="Buscar ejercicio">
        <div class="absolute inset-0 bg-black/40" @click="mostrarBuscador = false"></div>
        <div class="relative bg-white w-full sm:max-w-lg h-[85vh] sm:h-[75vh] rounded-t-3xl sm:rounded-2xl flex flex-col min-h-0 shadow-2xl px-4 pt-3 pb-4 safe-bottom">
          <div class="w-10 h-1 bg-gym-gray-300 rounded-full mx-auto mb-3 flex-shrink-0 sm:hidden" aria-hidden="true"></div>
          <ExercisesBrowser
            :seleccionados="planForm.ejerciciosDataset"
            @seleccionar="onEjercicioSeleccionado"
            @volver="mostrarBuscador = false"
          />
        </div>
      </div>
    </template>
    </template>

    <!-- Confirm sheets -->
    <ConfirmSheet
      :visible="mostrarConfirmPersona"
      titulo="Eliminar persona"
      :mensaje="`¿Eliminar a ${personaSel?.nombre} ${personaSel?.apellido} y todos sus planes?`"
      texto-confirmar="Eliminar"
      variante="danger"
      @confirmar="confirmarEliminarPersona"
      @cancelar="mostrarConfirmPersona = false"
    />

    <ConfirmSheet
      :visible="mostrarConfirmPlan"
      titulo="Eliminar plan"
      mensaje="¿Eliminar este plan? Esta acción no se puede deshacer."
      texto-confirmar="Eliminar"
      variante="danger"
      @confirmar="confirmarEliminarPlan"
      @cancelar="mostrarConfirmPlan = false"
    />
  </div>
</template>

<script lang="ts">
import db from '../../db'
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore'
import dbFirebase from '../../db/firebase'
import { useSyncStore } from '../../stores/sync'
import { useAdminStore } from '../../stores/admin'
import { traducirNombre, traducirCategoria } from '../../composables/useExercises'
import { defineAsyncComponent } from 'vue'
import LoginCard from '../../components/LoginCard.vue'
import PersonaCard from '../../components/PersonaCard.vue'
import PlanCard from '../../components/PlanCard.vue'
import ExerciseSetEditor from '../../components/ExerciseSetEditor.vue'
import ConfirmSheet from '../../components/ConfirmSheet.vue'
import EmptyState from '../../components/EmptyState.vue'
import type { Persona, Plan, Exercise, EjercicioSet } from '../../types'

const ExercisesBrowser = defineAsyncComponent(() => import('../ExercisesBrowserView.vue'))

interface PersonaForm {
  id: number | null
  nombre: string
  apellido: string
  dni: string
  direccion: string
  telefono: string
}

interface EjercicioDataset extends Exercise {
  sets: EjercicioSet[]
}

interface EjercicioManual {
  nombre: string
  grupoMuscular: string
  sets: EjercicioSet[]
}

interface PlanForm {
  id: number | null
  nombre: string
  ejerciciosDataset: EjercicioDataset[]
  ejerciciosManuales: EjercicioManual[]
}

export default {
  name: 'AdminView',
  components: { ExercisesBrowser, LoginCard, PersonaCard, PlanCard, ExerciseSetEditor, ConfirmSheet, EmptyState },
  data() {
    return {
      loginUser: '',
      loginPass: '',
      loginError: '',
      loginCargando: false,
      logueado: false,
      vista: 'lista' as string,
      busqueda: '',
      personas: [] as Persona[],
      planes: [] as Plan[],
      personaSel: null as Persona | null,
      personaForm: { id: null, nombre: '', apellido: '', dni: '', direccion: '', telefono: '' } as PersonaForm,
      planForm: { id: null, nombre: '', ejerciciosDataset: [], ejerciciosManuales: [] } as PlanForm,
      mostrarBuscador: false,
      guardando: false,
      personaEnviado: false,
      planEnviado: false,
      errorPlan: '',
      mostrarConfirmPersona: false,
      mostrarConfirmPlan: false,
      planParaEliminar: null as Plan | null
    }
  },
  computed: {
    syncStore() { return useSyncStore() },
    adminStore() { return useAdminStore() },
    personasFiltradas(): Persona[] {
      if (!this.busqueda.trim()) return this.ordenar(this.personas)
      const q = this.busqueda.toLowerCase()
      return this.ordenar(this.personas).filter(p =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
        (p.dni || '').includes(q)
      )
    },
    planesPersona(): Plan[] {
      if (!this.personaSel) return []
      return this.planes.filter(p => p.personaId === this.personaSel!.id)
    },
    personaValida(): boolean {
      return !!(this.personaForm.nombre.trim() && this.personaForm.apellido.trim() && this.personaForm.dni.trim()) && !this.dniDuplicado
    },
    dniDuplicado(): boolean {
      if (!this.personaForm.dni.trim()) return false
      return this.personas.some(p => p.dni === this.personaForm.dni.trim() && p.id !== this.personaForm.id)
    },
    planValido(): boolean {
      const tiene = this.planForm.ejerciciosDataset.length > 0 || this.planForm.ejerciciosManuales.length > 0
      return !!(this.planForm.nombre.trim()) && tiene
    },
    planMensajeValidacion(): string {
      const tiene = this.planForm.ejerciciosDataset.length > 0 || this.planForm.ejerciciosManuales.length > 0
      if (!this.planForm.nombre.trim() && !tiene) return 'Ponle un nombre y agregá ejercicios'
      if (!this.planForm.nombre.trim()) return 'Ponle un nombre al plan'
      if (!tiene) return 'Agregá al menos un ejercicio'
      return ''
    }
  },
  methods: {
    traducirNombre,
    traducirCategoria,
    getImgUrl(path: string): string { return `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${path}` },
    ordenar(lista: Persona[]): Persona[] {
      return [...lista].sort((a, b) => {
        return ((a.apellido || '') + (a.nombre || '')).localeCompare((b.apellido || '') + (b.nombre || ''))
      })
    },
    planesDe(id: number): Plan[] { return this.planes.filter(p => p.personaId === id) },
    async cargarDatos() {
      const adminId = this.adminStore.adminId
      this.personas = await db.personas.where('adminId').equals(adminId).toArray()
      this.planes = await db.planes.where('adminId').equals(adminId).toArray()
    },
    async doSync() {
      await this.syncStore.syncAdmin(this.adminStore.adminId || '')
      await this.cargarDatos()
    },

    async loginAdmin() {
      if (!this.loginUser.trim() || !this.loginPass.trim()) return
      this.loginCargando = true
      this.loginError = ''
      const ok = await this.adminStore.login(this.loginUser.trim(), this.loginPass)
      this.loginCargando = false
      if (!ok) {
        this.loginError = this.adminStore.error || ''
        return
      }
      this.logueado = true
      await this.doSync()
    },
    logoutAdmin() {
      this.adminStore.logout()
      this.logueado = false
      this.personas = []
      this.planes = []
      this.vista = 'lista'
      this.loginUser = ''
      this.loginPass = ''
    },

    nuevaPersona() {
      this.personaForm = { id: null, nombre: '', apellido: '', dni: '', direccion: '', telefono: '' }
      this.personaEnviado = false
      this.vista = 'persona-form'
    },
    verPersona(persona: Persona) {
      this.personaSel = persona
      this.vista = 'persona-detalle'
    },
    editarPersona() {
      if (this.personaSel) {
        this.personaForm = { id: this.personaSel.id || null, nombre: this.personaSel.nombre, apellido: this.personaSel.apellido, dni: this.personaSel.dni, direccion: this.personaSel.direccion || '', telefono: this.personaSel.telefono || '' }
      }
      this.personaEnviado = false
      this.vista = 'persona-form'
    },
    async guardarPersona() {
      this.personaEnviado = true
      if (!this.personaValida) return
      this.guardando = true
      try {
        const { id, ...rest } = this.personaForm
        const now = new Date().toISOString()
        let firebaseId: string | undefined

        try {
          if (id) {
            const existente = await db.personas.get(id)
            if (existente?.firebaseId) {
              firebaseId = existente.firebaseId
              await setDoc(doc(dbFirebase, 'personas', firebaseId), {
                ...rest, adminId: this.adminStore.adminId, updatedAt: now
              })
            }
          }
          if (!firebaseId) {
            const ref = doc(collection(dbFirebase, 'personas'))
            await setDoc(ref, { ...rest, adminId: this.adminStore.adminId, createdAt: now, updatedAt: now })
            firebaseId = ref.id
          }
        } catch { /* offline: will sync later */ }

        const data = JSON.parse(JSON.stringify({
          ...rest,
          adminId: this.adminStore.adminId,
          firebaseId: firebaseId || undefined,
          dirty: !firebaseId,
          createdAt: now,
          updatedAt: now
        }))
        if (id) {
          data.id = id
          await db.personas.put(data)
        } else {
          const newId = await db.personas.add(data)
          data.id = newId
        }
        await this.cargarDatos()
        if (this.personaForm.id) {
          this.personaSel = this.personas.find(p => p.id === this.personaForm.id) || null
          this.vista = 'persona-detalle'
        } else {
          this.vista = 'lista'
        }
      } catch (e) { console.error(e) } finally { this.guardando = false }
    },
    async confirmarEliminarPersona() {
      this.mostrarConfirmPersona = false
      if (!this.personaSel || !this.personaSel.id) return
      try {
        if (this.personaSel.firebaseId) {
          await deleteDoc(doc(dbFirebase, 'personas', this.personaSel.firebaseId))
        }
      } catch { /* offline */ }
      const planes = await db.planes.where('personaId').equals(this.personaSel.id).toArray()
      for (const plan of planes) {
        try {
          if (plan.firebaseId) await deleteDoc(doc(dbFirebase, 'planes', plan.firebaseId))
        } catch { /* offline */ }
        await db.planes.delete(plan.id!)
      }
      await db.personas.delete(this.personaSel.id)
      await this.cargarDatos()
      this.vista = 'lista'
    },

    nuevoPlan() {
      this.planForm = { id: null, nombre: '', ejerciciosDataset: [], ejerciciosManuales: [] }
      this.planEnviado = false
      this.errorPlan = ''
      this.vista = 'plan-form'
    },
    editarPlan(plan: Plan) {
      const dataset: EjercicioDataset[] = []
      const manuales: EjercicioManual[] = []
      for (const ej of (plan.exercises || [])) {
        if (ej.fromDataset) {
          dataset.push({ ...ej, sets: ej.sets ? JSON.parse(JSON.stringify(ej.sets)) : [{ peso: null, reps: null }] } as unknown as EjercicioDataset)
        } else {
          manuales.push({ nombre: ej.nombre, grupoMuscular: ej.grupoMuscular || '', sets: ej.sets ? JSON.parse(JSON.stringify(ej.sets)) : [{ peso: null, reps: null }] })
        }
      }
      this.planForm = { id: plan.id || null, nombre: plan.nombre || '', ejerciciosDataset: dataset, ejerciciosManuales: manuales }
      this.planEnviado = false
      this.errorPlan = ''
      this.vista = 'plan-form'
    },
    onEjercicioSeleccionado(ej: EjercicioDataset) {
      if (!this.planForm.ejerciciosDataset.some(e => e.id === ej.id)) {
        this.planForm.ejerciciosDataset.push({ ...ej, sets: [{ peso: null, reps: null }] })
      }
    },
    agregarManual() {
      this.planForm.ejerciciosManuales.push({ nombre: '', grupoMuscular: '', sets: [{ peso: null, reps: null }] })
    },
    async guardarPlan() {
      if (!this.planValido) { this.planEnviado = true; return }
      this.guardando = true
      this.errorPlan = ''
      try {
        const todos = JSON.parse(JSON.stringify([
          ...this.planForm.ejerciciosDataset.map((e: EjercicioDataset) => ({
            nombre: e.name, grupoMuscular: e.category, target: e.target, equipo: e.equipment,
            gif_url: e.gif_url, instructions: e.instructions, sets: e.sets, fromDataset: true, datasetId: e.id
          })),
          ...this.planForm.ejerciciosManuales
        ]))

        const { id: planId, ...planRest } = this.planForm
        const existingPlan = planId ? this.planes.find(p => p.id === planId) : null
        const now = new Date().toISOString()

        const persona = await db.personas.get(this.personaSel!.id!)
        const firebasePersonaId = persona?.firebaseId || String(this.personaSel!.id)

        let firebaseId: string | undefined
        try {
          const fbData = {
            nombre: planRest.nombre,
            exercises: todos,
            personaId: firebasePersonaId,
            adminId: this.adminStore.adminId,
            createdAt: existingPlan?.createdAt || now,
            updatedAt: now
          }
          if (existingPlan?.firebaseId) {
            firebaseId = existingPlan.firebaseId
            await setDoc(doc(dbFirebase, 'planes', firebaseId), fbData)
          } else {
            const ref = doc(collection(dbFirebase, 'planes'))
            await setDoc(ref, fbData)
            firebaseId = ref.id
          }
        } catch { /* offline: will sync later */ }

        const data = JSON.parse(JSON.stringify({
          ...(planId ? { id: planId } : {}),
          firebaseId: firebaseId || undefined,
          personaId: this.personaSel!.id,
          adminId: this.adminStore.adminId,
          nombre: planRest.nombre,
          exercises: todos,
          dirty: !firebaseId,
          createdAt: existingPlan?.createdAt || now,
          updatedAt: now
        }))
        if (planId) {
          await db.planes.put(data)
        } else {
          await db.planes.add(data)
        }
        await this.cargarDatos()
        this.vista = 'persona-detalle'
      } catch (e) {
        console.error(e)
        this.errorPlan = 'Error al guardar'
      } finally { this.guardando = false }
    },
    eliminarPlan(plan: Plan) {
      this.planParaEliminar = plan
      this.mostrarConfirmPlan = true
    },
    async confirmarEliminarPlan() {
      this.mostrarConfirmPlan = false
      if (!this.planParaEliminar || !this.planParaEliminar.id) return
      try {
        if (this.planParaEliminar.firebaseId) {
          await deleteDoc(doc(dbFirebase, 'planes', this.planParaEliminar.firebaseId))
        }
      } catch { /* offline */ }
      await db.planes.delete(this.planParaEliminar.id)
      await this.cargarDatos()
      this.planParaEliminar = null
    }
  },
  async created() {
    if (await this.adminStore.restaurarSesion()) {
      this.logueado = true
      await this.doSync()
    }
  }
}
</script>
