<template>
  <div>
    <!-- LOGIN -->
    <template v-if="currentView === 'login'">
      <LoginCard
        title="Mi Entrenamiento"
        subtitle="Ingresá tu DNI para ver tus planes"
        icon="ph:barbell-fill"
        :error="loginError"
        :loading="restoring"
        :isSaving="loading"
        :disabled="!dni.trim()"
        button-text="Ingresar"
        loading-text="Buscando..."
        @submit="login"
      >
        <div class="mb-4">
          <label for="student-dni" class="label-field">DNI</label>
          <input
            id="student-dni"
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
    <template v-if="currentView === 'seleccionar-gym'">
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
            <button v-for="gym in availableGyms" :key="gym.adminId" @click="selectGym(gym)" class="card card-hover p-5 w-full text-left">
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

          <button @click="currentView = 'login'; availableGyms = []" class="mt-6 text-sm text-gym-gray-500 font-semibold text-center w-full py-3">
            Volver
          </button>
        </div>
      </div>
    </template>

    <!-- LISTA DE PLANES -->
    <template v-if="currentView === 'planes'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="switchGym" class="btn-icon bg-gym-gray-200" aria-label="Cambiar gimnasio">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">Hola, {{ studentName }}</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5 truncate">{{ gymName }}</p>
        </div>
        <button @click="logout" class="btn-icon bg-gym-gray-200" aria-label="Cerrar sesión">
            <Icon icon="ph:sign-out" class="w-5 h-5 text-gym-gray-600" />
          </button>
      </div>

      <EmptyState v-if="studentPlans.length === 0" icon="ph:list-checks" title="Sin planes asignados" message="Tu entrenador aún no te asignó planes" />

      <div v-else class="space-y-3">
        <PlanCard
          v-for="plan in studentPlans"
          :key="plan.firebaseId"
          :plan="plan"
          :preview="false"
          @click="viewPlan(plan)"
        />
      </div>
    </template>

    <!-- VER PLAN -->
    <template v-if="currentView === 'ver-plan'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="currentView = 'planes'" class="btn-icon bg-gym-gray-200" aria-label="Volver a planes">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight truncate">{{ selectedPlan?.name || 'Plan' }}</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5 tabular-nums">{{ selectedPlan?.exercises?.length || 0 }} ejercicios</p>
        </div>
      </div>

      <div v-if="!selectedPlan" class="card text-center p-8">
        <p class="text-sm text-gym-gray-500">Plan no encontrado</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="(exercise, i) in selectedPlan.exercises" :key="i" class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-11 h-11 bg-gym-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <video v-if="exercise.videoUrl" :src="exercise.videoUrl" :playbackRate="exercise.isCustom ? 0.5 : 1" autoplay muted loop playsinline class="w-full h-full object-cover" />
              <img v-else-if="exercise.gifUrl" :src="getGifUrl(exercise.gifUrl)" :alt="exercise.name" class="w-full h-full object-cover" />
              <img v-else-if="exercise.image" :src="exercise.image" :alt="exercise.name" class="w-full h-full object-cover" />
              <Icon v-else icon="ph:barbell" class="w-5 h-5 text-gym-blue" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-gym-gray-900 leading-tight">{{ translateName(exercise.name || '') }}</h3>
              <p class="text-xs text-gym-gray-500 mt-0.5">{{ translateCategory(exercise.muscleGroup || exercise.category || '') }}</p>
            </div>
            <span class="text-xs font-bold text-gym-blue bg-gym-blue-100 px-2.5 py-1 rounded-full flex-shrink-0 tabular-nums">#{{ i + 1 }}</span>
          </div>

          <div v-if="exercise.videoUrl || exercise.gifUrl || exercise.image" class="mb-3 rounded-xl overflow-hidden bg-gym-gray-50">
            <video v-if="exercise.videoUrl" :src="exercise.videoUrl" :playbackRate="exercise.isCustom ? 0.5 : 1" autoplay muted loop playsinline class="w-full h-52 object-contain" />
            <img v-else-if="exercise.gifUrl" :src="getGifUrl(exercise.gifUrl)" :alt="exercise.name" class="w-full h-52 object-contain" />
            <img v-else :src="exercise.image" :alt="exercise.name" class="w-full h-52 object-contain" />
          </div>

          <div v-if="exercise.fromDataset && exercise.instructions && exercise.instructions.es" class="mb-3 p-3 bg-gym-gray-50 rounded-xl">
            <p class="text-xs text-gym-gray-600 leading-relaxed">{{ exercise.instructions.es }}</p>
          </div>

          <ExerciseSetEditor :model-value="exercise.sets || []" readonly />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { collection, query, where, getDocs } from 'firebase/firestore'
import dbFirebase from '../../db/firebase'
import { useStudentStore } from '../../stores/student'
import { translateName, translateCategory } from '../../composables/useExercises'
import LoginCard from '../../components/LoginCard.vue'
import PlanCard from '../../components/PlanCard.vue'
import ExerciseSetEditor from '../../components/ExerciseSetEditor.vue'
import EmptyState from '../../components/EmptyState.vue'
import type { Plan, GymInfo, ExercisePlanEntry } from '../../types'

export default {
  name: 'StudentView',
  components: { LoginCard, PlanCard, ExerciseSetEditor, EmptyState },
  data() {
    return {
      currentView: 'login' as string,
      dni: '',
      loading: false,
      loginError: '',
      restoring: false,
      person: null as { name: string; lastName: string; firebaseId: string } | null,
      studentPlans: [] as Plan[],
      selectedPlan: null as Plan | null,
      availableGyms: [] as GymInfo[],
      gymName: '',
      gymLogo: '',
      _currentDni: null as string | null
    }
  },
  computed: {
    studentName(): string {
      if (!this.person) return 'Alumno'
      return `${this.person.name || ''} ${this.person.lastName || ''}`.trim() || 'Alumno'
    }
  },
  mounted() {
    this._restore()
  },
  methods: {
    async _mergeExercises(exercises: ExercisePlanEntry[]): Promise<ExercisePlanEntry[]> {
      const ids = exercises.filter(e => e.fromDataset && e.datasetId).map(e => e.datasetId!)
      if (ids.length === 0) return exercises

      const map = new Map<string, Record<string, any>>()
      for (let i = 0; i < ids.length; i += 30) {
        const batch = ids.slice(i, i + 30)
        const q = query(collection(dbFirebase, 'exercises'), where('__name__', 'in', batch))
        const snap = await getDocs(q)
        snap.docs.forEach(d => map.set(d.id, d.data()))
      }

      return exercises.map(e => {
        if (!e.fromDataset || !e.datasetId) return e
        const latest = map.get(e.datasetId)
        if (!latest) return e
        return {
          ...e,
          name: latest.name || e.name,
          muscleGroup: latest.muscleGroup || e.muscleGroup,
          category: latest.category || e.category,
          target: latest.target || e.target,
          equipment: latest.equipment || e.equipment,
          gifUrl: latest.gifUrl || e.gifUrl,
          image: latest.image || e.image,
          videoUrl: latest.videoUrl || e.videoUrl,
          instructions: latest.instructions || e.instructions,
          isCustom: latest.isCustom ?? e.isCustom,
        }
      })
    },

    async _fetchPlans(personFirebaseId: string): Promise<Plan[]> {
      const q = query(collection(dbFirebase, 'plans'), where('personId', '==', personFirebaseId))
      const snapshot = await getDocs(q)
      const planes = snapshot.docs.map(d => ({ firebaseId: d.id, ...d.data() })) as Plan[]
      for (const plan of planes) {
        if (plan.exercises) {
          plan.exercises = await this._mergeExercises(plan.exercises)
        }
      }
      return planes
    },
    async _restore() {
      const raw = localStorage.getItem('student_session')
      if (!raw) return
      this.restoring = true
      const store = useStudentStore()
      const result = await store.restoreSession()
      this.restoring = false
      if (!result || result === 'error') return
      if (!result.ok) {
        this.availableGyms = result.gyms || []
        this.currentView = 'seleccionar-gym'
        return
      }
      this._currentDni = this.dni || this._currentDni
      this.person = result.person
      this.studentPlans = await this._fetchPlans(result.person.firebaseId)
      this.gymName = result.gymSeleccionado?.name || ''
      this.gymLogo = result.gymSeleccionado?.logo || ''
      this.currentView = 'planes'
    },
    translateName,
    translateCategory,
    getGifUrl(path: string): string { return `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${path}` },
    async login() {
      if (!this.dni.trim()) return
      this.loading = true
      this.loginError = ''
      const store = useStudentStore()
      const result = await store.login(this.dni.trim())
      this.loading = false
      if (result === 'error') {
        this.loginError = store.error || 'Error al iniciar sesión'
        return
      }
      if (!result) return
      if (!result.ok) {
        this.availableGyms = result.gyms || []
        this._currentDni = this.dni.trim()
        this.currentView = 'seleccionar-gym'
        return
      }
      this._currentDni = this.dni.trim()
      this.person = result.person
      this.studentPlans = await this._fetchPlans(result.person.firebaseId)
      this.gymName = result.gymSeleccionado?.name || ''
      this.gymLogo = result.gymSeleccionado?.logo || ''
      this.currentView = 'planes'
    },
    async selectGym(gym: GymInfo) {
      this.loading = true
      const store = useStudentStore()
      const result = await store.login(this._currentDni!, gym.adminId)
      this.loading = false
      if (!result || result === 'error' || !result.ok) return
      this.person = result.person
      this.studentPlans = await this._fetchPlans(result.person.firebaseId)
      this.gymName = result.gymSeleccionado?.name || ''
      this.gymLogo = result.gymSeleccionado?.logo || ''
      this.currentView = 'planes'
    },
    async switchGym() {
      this.loading = true
      const store = useStudentStore()
      const result = await store.switchGym()
      this.loading = false
      if (result) {
        this.availableGyms = result.gyms
        this.currentView = 'seleccionar-gym'
      }
    },
    async viewPlan(plan: Plan) {
      if (plan.exercises) {
        plan.exercises = await this._mergeExercises(plan.exercises)
      }
      this.selectedPlan = plan
      this.currentView = 'ver-plan'
    },
    logout() {
      const store = useStudentStore()
      store.logout()
      this.person = null
      this.studentPlans = []
      this.selectedPlan = null
      this.dni = ''
      this.availableGyms = []
      this.gymName = ''
      this.gymLogo = ''
      this._currentDni = null
      this.currentView = 'login'
    }
  }
}
</script>
