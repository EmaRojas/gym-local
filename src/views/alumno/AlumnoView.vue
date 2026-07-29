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
        <button @click="logout" class="btn-icon bg-gym-gray-200" aria-label="Cerrar sesión">
            <Icon icon="ph:sign-out" class="w-5 h-5 text-gym-gray-600" />
          </button>
      </div>

      <EmptyState v-if="planesAlumno.length === 0" icono="ph:list-checks" titulo="Sin planes asignados" mensaje="Tu entrenador aún no te asignó planes" />

      <div v-else class="space-y-3">
        <PlanCard
          v-for="plan in planesAlumno"
          :key="plan.firebaseId"
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
              <video v-if="ejercicio.video_base64" :src="ejercicio.video_base64" autoplay muted loop playsinline class="w-full h-full object-cover" />
              <img v-else-if="ejercicio.gif_url" :src="getGifUrl(ejercicio.gif_url)" :alt="ejercicio.nombre" class="w-full h-full object-cover" />
              <img v-else-if="ejercicio.image" :src="ejercicio.image" :alt="ejercicio.nombre" class="w-full h-full object-cover" />
              <Icon v-else icon="ph:barbell" class="w-5 h-5 text-gym-blue" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-gym-gray-900 leading-tight">{{ traducirNombre(ejercicio.nombre) }}</h3>
              <p class="text-xs text-gym-gray-500 mt-0.5">{{ traducirCategoria(ejercicio.grupoMuscular || ejercicio.category || '') }}</p>
            </div>
            <span class="text-xs font-bold text-gym-blue bg-gym-blue-100 px-2.5 py-1 rounded-full flex-shrink-0 tabular-nums">#{{ i + 1 }}</span>
          </div>

          <div v-if="ejercicio.video_base64 || ejercicio.gif_url || ejercicio.image" class="mb-3 rounded-xl overflow-hidden bg-gym-gray-50">
            <video v-if="ejercicio.video_base64" :src="ejercicio.video_base64" autoplay muted loop playsinline class="w-full h-52 object-contain" />
            <img v-else-if="ejercicio.gif_url" :src="getGifUrl(ejercicio.gif_url)" :alt="ejercicio.nombre" class="w-full h-52 object-contain" />
            <img v-else :src="ejercicio.image" :alt="ejercicio.nombre" class="w-full h-52 object-contain" />
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
      persona: null as Persona | null,
      planesAlumno: [] as Plan[],
      planSel: null as Plan | null,
      gymsDisponibles: [] as GymInfo[],
      nombreGym: '',
      logoGym: ''
    }
  },
  computed: {
    nombreAlumno(): string {
      if (!this.persona) return 'Alumno'
      return `${this.persona.nombre || ''} ${this.persona.apellido || ''}`.trim() || 'Alumno'
    }
  },
  mounted() {
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
