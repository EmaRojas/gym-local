<template>
  <div>
    <!-- LOGIN -->
    <template v-if="vista === 'login'">
      <LoginCard
        titulo="Mi Entrenamiento"
        subtitulo="Ingresá tu DNI para ver tus planes"
        icono="ph:barbell-fill"
        :error="errorLogin"
        :loading="restaurando"
        :cargando="cargando"
        :disabled="!dni.trim()"
        texto-botones="Ingresar"
        texto-cargando="Buscando..."
        @submit="login"
      >
        <div class="mb-4">
          <label for="alumno-dni" class="label-field">DNI</label>
          <input
            id="alumno-dni"
            v-model="dni"
            type="text"
            inputmode="numeric"
            class="input-field text-center text-lg tracking-widest"
            placeholder="12345678"
            maxlength="10"
            @input="dni = dni.replace(/[^0-9]/g, '')"
            @keyup.enter="login"
            autocomplete="off"
          />
        </div>
      </LoginCard>
    </template>

    <!-- SELECCIONAR GYM -->
    <template v-if="vista === 'seleccionar-gym'">
      <div class="flex items-center justify-center min-h-[70vh]">
        <div class="max-w-sm w-full">
          <div class="text-center mb-10">
            <div class="w-16 h-16 bg-gym-blue rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Icon icon="ph:buildings" class="w-8 h-8 text-white" />
            </div>
            <h1 class="text-2xl font-bold text-gym-gray-900">Elegí tu gimnasio</h1>
            <p class="text-sm text-gym-gray-500 mt-2 leading-relaxed">Estás registrado en más de un lugar</p>
          </div>

          <div class="space-y-3">
            <button v-for="gym in gymsDisponibles" :key="gym.adminId" @click="seleccionarGym(gym)" class="card card-hover p-5 w-full text-left">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  :class="gym.logo ? 'bg-gym-gray-100' : 'bg-gym-blue-100'">
                  <img v-if="gym.logo" :src="gym.logo" :alt="gym.name" class="w-full h-full object-cover" />
                  <Icon v-else icon="ph:buildings" class="w-6 h-6 text-gym-blue" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-gym-gray-900 text-lg leading-tight">{{ gym.name }}</h3>
                </div>
                <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
              </div>
            </button>
          </div>

          <button @click="vista = 'login'; gymsDisponibles = []" class="mt-6 text-sm text-gym-gray-500 font-semibold text-center w-full py-3">
            Volver
          </button>
        </div>
      </div>
    </template>

    <!-- LISTA DE PLANES -->
    <template v-if="vista === 'planes'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="cambiarGym" class="btn-icon bg-gym-gray-200" aria-label="Cambiar gimnasio">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">Hola, {{ nombreAlumno }}</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5 truncate">{{ nombreGym }}</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button @click="instalarApp" v-if="puedeInstalar" class="btn-icon bg-green-100" aria-label="Instalar app">
            <Icon icon="ph:download-simple" class="w-5 h-5 text-green-600" />
          </button>
          <button @click="sincronizar" :disabled="sincronizando" class="btn-icon"
            :class="sincronizando ? 'bg-gym-blue-100 animate-spin' : 'bg-gym-blue-100'" aria-label="Sincronizar datos">
            <Icon icon="ph:arrows-clockwise" class="w-5 h-5 text-gym-blue" />
          </button>
          <button @click="logout" class="btn-icon bg-gym-gray-200" aria-label="Cerrar sesión">
            <Icon icon="ph:sign-out" class="w-5 h-5 text-gym-gray-600" />
          </button>
        </div>
      </div>

      <div v-if="mostrarToastInstalar" class="mb-4 p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
        <Icon icon="ph:download-simple" class="w-5 h-5 text-green-600 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-green-800">Instalá la app</p>
          <p class="text-xs text-green-600 mt-0.5" v-if="esIOS">Tocá Compartir y luego "Agregar a pantalla de inicio"</p>
          <p class="text-xs text-green-600 mt-0.5" v-else>Touch en el ícono verde de arriba para instalar</p>
        </div>
        <button @click="mostrarToastInstalar = false" class="btn-icon-sm text-green-400 flex-shrink-0" aria-label="Cerrar aviso">
          <Icon icon="ph:x" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="syncError" class="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
        <Icon icon="ph:warning-circle" class="w-5 h-5 text-red-500 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-red-800">No se pudo sincronizar</p>
          <p class="text-xs text-red-600 mt-0.5">{{ syncError }}</p>
        </div>
        <button @click="syncError = ''" class="btn-icon-sm text-red-400 flex-shrink-0" aria-label="Cerrar error">
          <Icon icon="ph:x" class="w-5 h-5" />
        </button>
      </div>

      <EmptyState v-if="planesAlumno.length === 0" icono="ph:list-checks" titulo="Sin planes asignados" mensaje="Tu entrenador aún no te asignó planes" />

      <div v-else class="space-y-3">
        <PlanCard
          v-for="plan in planesAlumno"
          :key="plan.id"
          :plan="plan"
          :preview="false"
          @click="verPlan(plan)"
        />
      </div>
    </template>

    <!-- VER PLAN -->
    <template v-if="vista === 'ver-plan'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="vista = 'planes'" class="btn-icon bg-gym-gray-200" aria-label="Volver a planes">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight truncate">{{ planSel?.nombre || 'Plan' }}</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5 tabular-nums">{{ planSel?.exercises?.length || 0 }} ejercicios</p>
        </div>
      </div>

      <div v-if="!planSel" class="card text-center p-8">
        <p class="text-sm text-gym-gray-500">Plan no encontrado</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="(ejercicio, i) in planSel.exercises" :key="i" class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-11 h-11 bg-gym-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img v-if="ejercicio.gif_url" :src="getGifUrl(ejercicio.gif_url)" :alt="ejercicio.nombre" class="w-full h-full object-cover" />
              <Icon v-else icon="ph:barbell" class="w-5 h-5 text-gym-blue" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-gym-gray-900 leading-tight">{{ traducirNombre(ejercicio.nombre) }}</h3>
              <p class="text-xs text-gym-gray-500 mt-0.5">{{ traducirCategoria(ejercicio.grupoMuscular || ejercicio.category || '') }}</p>
            </div>
            <span class="text-xs font-bold text-gym-blue bg-gym-blue-100 px-2.5 py-1 rounded-full flex-shrink-0 tabular-nums">#{{ i + 1 }}</span>
          </div>

          <div v-if="ejercicio.gif_url" class="mb-3 rounded-xl overflow-hidden bg-gym-gray-50">
            <img :src="getGifUrl(ejercicio.gif_url)" :alt="ejercicio.nombre" class="w-full h-52 object-contain" />
          </div>

          <div v-if="ejercicio.fromDataset && ejercicio.instructions && ejercicio.instructions.es" class="mb-3 p-3 bg-gym-gray-50 rounded-xl">
            <p class="text-xs text-gym-gray-600 leading-relaxed">{{ ejercicio.instructions.es }}</p>
          </div>

          <ExerciseSetEditor :model-value="ejercicio.sets || []" readonly />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { useAlumnoStore } from '../../stores/alumno'
import { traducirNombre, traducirCategoria } from '../../composables/useExercises'
import LoginCard from '../../components/LoginCard.vue'
import PlanCard from '../../components/PlanCard.vue'
import ExerciseSetEditor from '../../components/ExerciseSetEditor.vue'
import EmptyState from '../../components/EmptyState.vue'
import type { Persona, Plan, GymInfo } from '../../types'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default {
  name: 'AlumnoView',
  components: { LoginCard, PlanCard, ExerciseSetEditor, EmptyState },
  data() {
    return {
      vista: 'login' as string,
      dni: '',
      cargando: false,
      errorLogin: '',
      restaurando: false,
      sincronizando: false,
      persona: null as Persona | null,
      planesAlumno: [] as Plan[],
      planSel: null as Plan | null,
      deferredPrompt: null as BeforeInstallPromptEvent | null,
      puedeInstalar: false,
      mostrarToastInstalar: false,
      gymsDisponibles: [] as GymInfo[],
      nombreGym: '',
      logoGym: '',
      syncError: ''
    }
  },
  computed: {
    nombreAlumno(): string {
      if (!this.persona) return 'Alumno'
      return `${this.persona.nombre || ''} ${this.persona.apellido || ''}`.trim() || 'Alumno'
    },
    esIOS(): boolean {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    }
  },
  mounted() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
      this.puedeInstalar = true
      if (!localStorage.getItem('install_toast_shown')) {
        this.mostrarToastInstalar = true
        localStorage.setItem('install_toast_shown', '1')
      }
    })
    window.addEventListener('appinstalled', () => {
      this.puedeInstalar = false
      this.deferredPrompt = null
    })

    if (this.esIOS && !localStorage.getItem('install_toast_shown')) {
      this.mostrarToastInstalar = true
      localStorage.setItem('install_toast_shown', '1')
    }

    this._restaurar()
  },
  methods: {
    async _restaurar() {
      const dniGuardado = localStorage.getItem('alumno_session')
      if (dniGuardado) {
        this.restaurando = true
        const store = useAlumnoStore()
        const ok = await store.restaurarSesion()
        this.restaurando = false
        if (ok === 'seleccionar-gym') {
          this.gymsDisponibles = store.gymsDisponibles
          this.vista = 'seleccionar-gym'
          return
        }
        if (ok) {
          this.persona = store.persona
          this.planesAlumno = store.planes
          this.nombreGym = store.nombreGym
          this.logoGym = store.logoGym
          this.vista = 'planes'
        }
      }
    },
    traducirNombre,
    traducirCategoria,
    getGifUrl(path: string): string { return `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${path}` },
    async instalarApp() {
      if (!this.deferredPrompt) return
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      if (outcome === 'accepted') {
        this.puedeInstalar = false
        this.mostrarToastInstalar = false
      }
      this.deferredPrompt = null
    },
    async login() {
      if (!this.dni.trim()) return
      this.cargando = true
      this.errorLogin = ''
      const store = useAlumnoStore()
      const result = await store.login(this.dni.trim())
      this.cargando = false
      if (result === 'seleccionar-gym') {
        this.gymsDisponibles = store.gymsDisponibles
        this.vista = 'seleccionar-gym'
        return
      }
      if (!result) {
        this.errorLogin = store.error || ''
        return
      }
      this.persona = store.persona
      this.planesAlumno = store.planes
      this.nombreGym = store.nombreGym
      this.logoGym = store.logoGym
      this.vista = 'planes'
    },
    async seleccionarGym(gym: GymInfo) {
      this.cargando = true
      const store = useAlumnoStore()
      await store.seleccionarGym(gym)
      this.cargando = false
      this.persona = store.persona
      this.planesAlumno = store.planes
      this.nombreGym = store.nombreGym
      this.logoGym = store.logoGym
      this.vista = 'planes'
    },
    async sincronizar() {
      this.sincronizando = true
      this.syncError = ''
      const store = useAlumnoStore()
      await store.sincronizar()
      this.persona = store.persona
      this.planesAlumno = store.planes
      if (store.error) {
        this.syncError = store.error
      }
      this.sincronizando = false
    },
    async cambiarGym() {
      this.cargando = true
      const store = useAlumnoStore()
      const result = await store.cambiarGym()
      this.cargando = false
      if (result === 'seleccionar-gym') {
        this.gymsDisponibles = store.gymsDisponibles
        this.vista = 'seleccionar-gym'
      }
    },
    verPlan(plan: Plan) {
      this.planSel = plan
      this.vista = 'ver-plan'
    },
    logout() {
      const store = useAlumnoStore()
      store.logout()
      this.persona = null
      this.planesAlumno = []
      this.planSel = null
      this.dni = ''
      this.gymsDisponibles = []
      this.nombreGym = ''
      this.logoGym = ''
      this.vista = 'login'
    }
  }
}
</script>
