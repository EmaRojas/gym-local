<template>
  <div>
    <!-- LOGIN ADMIN -->
    <LoginCard
      v-if="!isLoggedIn"
      title="Panel Admin"
      subtitle="Ingresá tu usuario y contraseña"
      icon="ph:shield-check"
      icon-bg-class="bg-gym-gray-800"
      :error="loginError"
      :isSaving="loginSaving"
      :disabled="!loginEmail.trim() || !loginPass.trim()"
      button-text="Ingresar"
      loading-text="Entrando..."
      @submit="loginAdmin"
    >
      <div class="mb-4">
        <label for="admin-email" class="label-field">Email</label>
        <input id="admin-email" v-model="loginEmail" type="email" class="input-field" placeholder="Email" @keyup.enter="loginAdmin" autocomplete="email" />
      </div>
      <div class="mb-2">
        <label for="admin-password" class="label-field">Contraseña</label>
        <input id="admin-password" v-model="loginPass" type="password" class="input-field" placeholder="Contraseña" @keyup.enter="loginAdmin" autocomplete="current-password" />
      </div>
    </LoginCard>

    <!-- PANEL ADMIN (requiere login) -->
    <template v-if="isLoggedIn">
    <!-- LISTA DE PERSONAS -->
    <template v-if="currentView === 'lista'">
      <div class="flex items-center gap-3 mb-6 lg:mb-8">
        <button @click="$router.push('/')" class="btn-icon bg-gym-gray-100" aria-label="Volver al inicio">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl lg:text-2xl font-bold text-gym-gray-900 leading-tight">Personas</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5 tabular-nums">{{ persons.length }} personas</p>
        </div>
        <button @click="logoutAdmin" class="btn-icon bg-gym-gray-200" aria-label="Cerrar sesión">
          <Icon icon="ph:sign-out" class="w-5 h-5 text-gym-gray-600" />
        </button>
      </div>

      <div class="md:grid md:grid-cols-2 md:gap-4 mb-6">
        <button @click="newPerson" class="card card-hover p-4 flex items-center gap-3.5 mb-3 md:mb-0 w-full">
          <div class="w-12 h-12 bg-gym-blue rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon icon="ph:plus" class="w-6 h-6 text-white" />
          </div>
          <div class="min-w-0 flex-1 text-left">
            <h3 class="font-bold text-gym-gray-900 leading-tight">Nueva persona</h3>
            <p class="text-xs text-gym-gray-500 mt-0.5">Cargá los datos de un alumno</p>
          </div>
          <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
        </button>

        <button @click="currentView = 'custom-exercises'" class="card card-hover p-4 flex items-center gap-3.5 w-full">
          <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon icon="ph:barbell" class="w-6 h-6 text-white" />
          </div>
          <div class="min-w-0 flex-1 text-left">
            <h3 class="font-bold text-gym-gray-900 leading-tight">Ejercicios personalizados</h3>
            <p class="text-xs text-gym-gray-500 mt-0.5">Creá y gestioná tus propios ejercicios</p>
          </div>
          <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
        </button>
      </div>

      <div class="mb-4">
        <label for="search-persons" class="sr-only">Buscar personas</label>
        <input id="search-persons" v-model="searchQuery" type="text" class="input-field" placeholder="Buscar por nombre o DNI..." />
      </div>

      <div v-if="loadingData" class="space-y-3">
        <SkeletonCard v-for="i in 4" :key="i" />
      </div>
      <EmptyState v-else-if="filteredPersons.length === 0" icon="ph:users" title="No hay personas cargadas" />

      <div v-else class="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        <PersonCard
          v-for="p in filteredPersons"
          :key="p.id"
          :person="p"
          :plan-count="plansFor(p.id!).length"
          @click="viewPerson(p)"
        />
        <div v-if="hasMorePersons && !searchQuery" class="text-center pt-2 pb-4 md:col-span-2">
          <button type="button" @click="loadMorePersons" :disabled="loadingMore" class="btn-sm text-gym-blue px-8">
            <Icon v-if="loadingMore" icon="ph:spinner" class="w-4 h-4 inline animate-spin mr-1.5" />
            {{ loadingMore ? 'Cargando...' : 'Cargar más personas' }}
          </button>
        </div>
      </div>
    </template>

      <PersonFormView
        v-if="currentView === 'person-form'"
        :person-data="personForm"
        :all-persons="persons"
        @saved="onPersonSaved"
        @cancel="currentView = personForm.id ? 'person-detail' : 'lista'"
      />

    <PersonDetailView
      v-if="currentView === 'person-detail'"
      :person="selectedPerson"
      :plans="personPlans"
      @back="currentView = 'lista'"
      @edit="editPerson"
      @delete="showConfirmPerson = true"
      @new-plan="newPlan"
      @edit-plan="editPlan"
      @delete-plan="deletePlan"
    />

    <PlanFormView
      v-if="currentView === 'plan-form'"
      :plan-data="planForm"
      :person-name="selectedPerson ? (selectedPerson.name + ' ' + selectedPerson.lastName) : ''"
      :person-id="selectedPerson?.id || ''"
      :admin-id="adminStore.adminId || ''"
      @saved="onPlanSaved"
      @cancel="currentView = 'person-detail'"
    />

    <CustomExerciseView
      v-if="currentView === 'custom-exercises'"
      :admin-id="adminStore.adminId || ''"
      @back="currentView = 'lista'"
    />
    </template>

    <!-- Confirm sheets -->
    <ConfirmSheet
      :visible="showConfirmPerson"
      title="Eliminar persona"
      :message="`¿Eliminar a ${selectedPerson?.name} ${selectedPerson?.lastName} y todos sus planes?`"
      confirm-text="Eliminar"
      variant="danger"
      @confirm="confirmDeletePerson"
      @cancel="showConfirmPerson = false"
    />

    <ConfirmSheet
      :visible="showConfirmPlan"
      title="Eliminar plan"
      message="¿Eliminar este plan? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      variant="danger"
      @confirm="confirmDeletePlan"
      @cancel="showConfirmPlan = false"
    />

  </div>
</template>

<script lang="ts">
import pb from '../../db/pocketbase'
import { useExercises } from '../../composables/useExercises'
import { useAdminStore } from '../../stores/admin'
import PersonFormView from './PersonFormView.vue'
import PersonDetailView from './PersonDetailView.vue'
import PlanFormView from './PlanFormView.vue'
import CustomExerciseView from './CustomExerciseView.vue'
import LoginCard from '../../components/LoginCard.vue'
import PersonCard from '../../components/PersonCard.vue'
import PlanCard from '../../components/PlanCard.vue'
import ConfirmSheet from '../../components/ConfirmSheet.vue'
import EmptyState from '../../components/EmptyState.vue'
import SkeletonCard from '../../components/SkeletonCard.vue'
import type { Person, Plan, Exercise, ExerciseSet } from '../../types'

interface PersonForm {
  id: string | null
  name: string
  lastName: string
  dni: string
  address: string
  phone: string
}

interface ExerciseDataset extends Exercise {
  sets: ExerciseSet[]
}

interface ManualExercise {
  name: string
  muscleGroup: string
  sets: ExerciseSet[]
}

interface PlanForm {
  id: string | null
  name: string
  datasetExercises: ExerciseDataset[]
  manualExercises: ManualExercise[]
}

export default {
  name: 'AdminView',
  components: { PersonFormView, PersonDetailView, PlanFormView, CustomExerciseView, LoginCard, PersonCard, PlanCard, ConfirmSheet, EmptyState, SkeletonCard },
  data() {
    return {
      loginEmail: '',
      loginPass: '',
      loginError: '',
      loginSaving: false,
      isLoggedIn: false,
      currentView: 'lista' as string,
      searchQuery: '',
      persons: [] as Person[],
      plans: [] as Plan[],
      selectedPerson: null as Person | null,
      personForm: { id: null, name: '', lastName: '', dni: '', address: '', phone: '' } as PersonForm,
      planForm: { id: null, name: '', datasetExercises: [], manualExercises: [] } as PlanForm,
      isSaving: false,
      showConfirmPerson: false,
      showConfirmPlan: false,
      planToDelete: null as Plan | null,
      loadingData: true,
      loadingMore: false,
      hasMorePersons: true,
      personsPage: 1,
    }
  },
  computed: {
    adminStore() { return useAdminStore() },
    filteredPersons(): Person[] {
      if (!this.searchQuery.trim()) return this.sortPersons(this.persons)
      const q = this.searchQuery.toLowerCase()
      return this.sortPersons(this.persons).filter(p =>
        `${p.name} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.dni || '').includes(q)
      )
    },
    personPlans(): Plan[] {
      if (!this.selectedPerson) return []
      return this.plans.filter(p => p.personId === this.selectedPerson!.id)
    },

  },
  methods: {

    sortPersons(lista: Person[]): Person[] {
      return [...lista].sort((a, b) => {
        return ((a.lastName || '') + (a.name || '')).localeCompare((b.lastName || '') + (b.name || ''))
      })
    },
    plansFor(id: string): Plan[] { return this.plans.filter(p => p.personId === id) },
    async loadData() {
      this.loadingData = true
      this.hasMorePersons = true
      this.personsPage = 1
      const adminId = this.adminStore.adminId || ''
      const PAGE_SIZE = 50

      const [personsResult, plansResult] = await Promise.allSettled([
        pb.collection('persons').getList(this.personsPage, PAGE_SIZE, {
          filter: `adminId = "${adminId}"`,
          sort: 'lastName'
        }),
        pb.collection('plans').getFullList({
          filter: `adminId = "${adminId}"`
        })
      ])

      if (personsResult.status === 'fulfilled') {
        this.persons = personsResult.value.items as unknown as Person[]
        this.hasMorePersons = personsResult.value.totalItems > personsResult.value.page * personsResult.value.perPage
      } else {
        this.persons = []
      }
      if (plansResult.status === 'fulfilled') {
        this.plans = plansResult.value as unknown as Plan[]
      } else {
        this.plans = []
      }
      this.loadingData = false
    },

    async loadMorePersons() {
      if (!this.hasMorePersons || this.loadingMore) return
      this.loadingMore = true
      const adminId = this.adminStore.adminId || ''
      const PAGE_SIZE = 50
      try {
        const nextPage = this.personsPage + 1
        const result = await pb.collection('persons').getList(nextPage, PAGE_SIZE, {
          filter: `adminId = "${adminId}"`,
          sort: 'lastName'
        })
        const more = result.items as unknown as Person[]
        this.persons = [...this.persons, ...more]
        this.personsPage = nextPage
        this.hasMorePersons = result.totalItems > result.page * result.perPage
      } catch {
        // silently fail
      } finally {
        this.loadingMore = false
      }
    },

    async loginAdmin() {
      if (!this.loginEmail.trim() || !this.loginPass.trim()) return
      this.loginSaving = true
      this.loginError = ''
      const ok = await this.adminStore.login(this.loginEmail.trim(), this.loginPass)
      this.loginSaving = false
      if (!ok) {
        this.loginError = this.adminStore.error || ''
        return
      }
      this.isLoggedIn = true
      await this.loadData()
      await useExercises().loadCustomExercises(this.adminStore.adminId!)
    },
    async logoutAdmin() {
      await this.adminStore.logout()
      this.isLoggedIn = false
      this.persons = []
      this.plans = []
      this.currentView = 'lista'
      this.loginEmail = ''
      this.loginPass = ''
    },

    newPerson() {
      this.personForm = { id: null, name: '', lastName: '', dni: '', address: '', phone: '' }
      this.currentView = 'person-form'
    },
    viewPerson(person: Person) {
      this.selectedPerson = person
      this.currentView = 'person-detail'
    },
    editPerson() {
      if (this.selectedPerson) {
        this.personForm = { id: this.selectedPerson.id || null, name: this.selectedPerson.name, lastName: this.selectedPerson.lastName, dni: this.selectedPerson.dni, address: this.selectedPerson.address || '', phone: this.selectedPerson.phone || '' }
      }
      this.currentView = 'person-form'
    },
    async onPersonSaved(result: { id: string }) {
      await this.loadData()
      if (result.id) {
        this.selectedPerson = this.persons.find(p => p.id === result.id) || null
        this.currentView = 'person-detail'
      } else {
        this.currentView = 'lista'
      }
    },
    async confirmDeletePerson() {
      this.showConfirmPerson = false
      if (!this.selectedPerson || !this.selectedPerson.id) return
      try {
        const plans = await pb.collection('plans').getFullList({
          filter: `personId = "${this.selectedPerson.id}"`
        })
        const deletes = plans.map(p => pb.collection('plans').delete(p.id))
        deletes.push(pb.collection('persons').delete(this.selectedPerson.id))
        await Promise.all(deletes)
      } catch (e) { console.error(e) }
      await this.loadData()
      this.currentView = 'lista'
    },

    newPlan() {
      this.planForm = { id: null, name: '', datasetExercises: [], manualExercises: [] }
      this.currentView = 'plan-form'
    },
    async editPlan(plan: Plan) {
      const { exercises, exercisesLoaded, loadExercises } = useExercises()
      if (!exercisesLoaded.value) {
        await loadExercises(this.adminStore.adminId || undefined)
      }
      const dataset: ExerciseDataset[] = []
      const manuales: ManualExercise[] = []
      for (const ej of (plan.exercises || [])) {
        if (ej.fromDataset && ej.datasetId) {
          const full = exercises.value.find((e: Exercise) => e.id === ej.datasetId)
          if (full) {
            dataset.push({
              ...full,
              sets: ej.sets ? JSON.parse(JSON.stringify(ej.sets)) : [{ weight: null, reps: null, seconds: null }]
            })
          } else {
            dataset.push({
              id: ej.datasetId,
              name: ej.name || '',
              category: ej.muscleGroup || ej.category || '',
              equipment: ej.equipment || '',
              target: ej.target || '',
              muscleGroup: ej.muscleGroup || '',
              gifUrl: ej.gifUrl,
              image: ej.image,
              videoUrl: ej.videoUrl,
              sets: ej.sets ? JSON.parse(JSON.stringify(ej.sets)) : [{ weight: null, reps: null, seconds: null }]
            } as ExerciseDataset)
          }
        } else if (!ej.fromDataset) {
          manuales.push({ name: ej.name || '', muscleGroup: ej.muscleGroup || '', sets: ej.sets ? JSON.parse(JSON.stringify(ej.sets)) : [{ weight: null, reps: null, seconds: null }] })
        }
      }
      this.planForm = { id: plan.id || null, name: plan.name || '', datasetExercises: dataset, manualExercises: manuales }
      this.currentView = 'plan-form'
    },
    async onPlanSaved() {
      await this.loadData()
      this.currentView = 'person-detail'
    },
    deletePlan(plan: Plan) {
      this.planToDelete = plan
      this.showConfirmPlan = true
    },
    async confirmDeletePlan() {
      this.showConfirmPlan = false
      if (!this.planToDelete || !this.planToDelete.id) return
      try {
        await pb.collection('plans').delete(this.planToDelete.id)
      } catch (e) { console.error(e) }
      await this.loadData()
      this.planToDelete = null
    },
  },
  async created() {
    if (await this.adminStore.restoreSession()) {
      this.isLoggedIn = true
      await this.loadData()
      await useExercises().loadCustomExercises(this.adminStore.adminId!)
    }
  }
}
</script>
