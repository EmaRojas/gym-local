<template>
  <div class="flex items-center gap-3 mb-6 lg:mb-8">
    <button @click="$emit('cancel')" class="btn-icon bg-gym-gray-100" aria-label="Volver">
      <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
    </button>
    <div class="flex-1 min-w-0">
      <h1 class="text-xl lg:text-2xl font-bold text-gym-gray-900 leading-tight">{{ form.id ? 'Editar plan' : 'Nuevo plan' }}</h1>
      <p class="text-sm text-gym-gray-500 mt-0.5 truncate">Para: {{ personName }}</p>
    </div>
  </div>

  <div class="card p-5 mb-4">
    <label for="plan-nombre" class="label-field">Nombre del plan</label>
    <input id="plan-nombre" v-model="form.name" type="text" class="input-field" placeholder="Ej: Torso, Fuerza, etc." />
  </div>

  <button @click="showBrowser = true" class="card card-hover p-4 flex items-center gap-3 mb-4 w-full">
    <div class="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon icon="ph:magnifying-glass" class="w-5 h-5 text-green-600" />
    </div>
    <div class="flex-1 text-left min-w-0">
      <span class="font-semibold text-gym-gray-700 leading-tight block">Buscar ejercicio del catálogo</span>
      <p class="text-xs text-gym-gray-500 mt-0.5 tabular-nums">{{ form.datasetExercises.length }} seleccionados</p>
    </div>
    <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
  </button>

  <div v-if="form.datasetExercises.length === 0 && form.manualExercises.length === 0" class="text-center text-sm text-gym-gray-400 mb-4 py-2">
    Agregá ejercicios del catálogo o manualmente
  </div>

  <div class="lg:grid lg:grid-cols-2 lg:gap-4">
    <div v-if="form.datasetExercises.length > 0" class="mb-5 lg:mb-0">
      <h3 class="text-sm font-semibold text-gym-gray-700 mb-2.5">Del catálogo ({{ form.datasetExercises.length }})</h3>
      <div class="space-y-3">
        <div v-for="(ej, i) in form.datasetExercises" :key="ej.id" class="card p-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gym-gray-100">
              <img v-if="ej.gifUrl" :src="getImgUrl(ej.gifUrl)" :alt="ej.name" class="w-full h-full object-cover" />
              <img v-else-if="ej.image" :src="ej.image" :alt="ej.name" class="w-full h-full object-cover" />
              <Icon v-else icon="ph:barbell" class="w-5 h-5 text-gym-gray-400" />
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="text-sm font-semibold text-gym-gray-900 truncate leading-tight">{{ translateName(ej.name) }}</h4>
              <p class="text-xs text-gym-gray-500 mt-0.5">{{ translateCategory(ej.category) }}</p>
            </div>
            <button @click="form.datasetExercises.splice(i, 1)" class="btn-icon bg-gym-gray-100" :aria-label="`Quitar ${translateName(ej.name)}`">
              <Icon icon="ph:x" class="w-5 h-5 text-gym-gray-400" />
            </button>
          </div>
          <div class="mt-3">
            <ExerciseSetEditor v-model="ej.sets" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="form.manualExercises.length > 0" class="mb-5">
      <h3 class="text-sm font-semibold text-gym-gray-700 mb-2.5">Manuales ({{ form.manualExercises.length }})</h3>
      <div class="space-y-3">
        <div v-for="(ej, i) in form.manualExercises" :key="i" class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex-1">
              <label :for="`manual-nombre-${i}`" class="sr-only">Nombre del ejercicio manual</label>
              <input :id="`manual-nombre-${i}`" v-model="ej.name" type="text" class="input-field" placeholder="Nombre del ejercicio" />
            </div>
            <button @click="form.manualExercises.splice(i, 1)" class="btn-icon bg-gym-gray-100 flex-shrink-0" :aria-label="'Quitar ejercicio ' + (Number(i) + 1)">
              <Icon icon="ph:x" class="w-5 h-5 text-gym-gray-400" />
            </button>
          </div>
          <div class="mb-3">
            <label :for="`manual-grupo-${i}`" class="sr-only">Grupo muscular</label>
            <input :id="`manual-grupo-${i}`" v-model="ej.muscleGroup" type="text" class="input-field" placeholder="Grupo muscular" />
          </div>
          <ExerciseSetEditor v-model="ej.sets" />
        </div>
      </div>
    </div>
  </div>

  <button @click="addManual" class="card card-hover p-4 flex items-center gap-3 mb-5 w-full">
    <div class="w-11 h-11 bg-gym-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon icon="ph:plus" class="w-5 h-5 text-gym-blue" />
    </div>
    <span class="font-semibold text-gym-gray-700">Agregar ejercicio manual</span>
  </button>

  <p v-if="!isValid && submitted" class="text-sm text-red-500 font-medium text-center mb-4" role="alert">{{ validationMessage }}</p>
  <p v-if="error" class="text-sm text-red-500 font-medium text-center mb-4" role="alert">{{ error }}</p>

  <div class="safe-bottom">
    <button @click="save" :disabled="saving || !isValid" class="btn-primary w-full mb-4">
      {{ saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Asignar plan' }}
    </button>
  </div>

  <div v-if="showBrowser" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4" @keydown.window.escape="showBrowser = false" role="dialog" aria-modal="true" aria-label="Buscar ejercicio">
    <div class="absolute inset-0 bg-black/40" @click="showBrowser = false"></div>
    <div class="relative bg-white w-full sm:max-w-lg lg:max-w-2xl max-h-[85dvh] sm:max-h-[75vh] flex flex-col min-h-0 shadow-2xl px-4 pt-3 pb-4 safe-bottom rounded-t-3xl sm:rounded-2xl">
      <div class="w-10 h-1 bg-gym-gray-300 rounded-full mx-auto mb-3 flex-shrink-0 sm:hidden" aria-hidden="true"></div>
      <ExercisesBrowser
        :seleccionados="form.datasetExercises"
        :admin-id="adminId"
        @select="onExerciseSelected"
        @back="showBrowser = false"
      />
    </div>
  </div>
</template>

<script lang="ts">
import pb from '../../db/pocketbase'
import { translateName, translateCategory } from '../../composables/useExercises'
import { useAdminStore } from '../../stores/admin'
import { defineAsyncComponent } from 'vue'
import ExerciseSetEditor from '../../components/ExerciseSetEditor.vue'
import type { Exercise, ExerciseSet } from '../../types'

interface ManualExercise {
  name: string
  muscleGroup: string
  sets: ExerciseSet[]
}

interface ExerciseDataset extends Exercise {
  sets: ExerciseSet[]
}

interface PlanForm {
  id: string | null
  name: string
  datasetExercises: ExerciseDataset[]
  manualExercises: ManualExercise[]
}

const ExercisesBrowser = defineAsyncComponent(() => import('../ExercisesBrowserView.vue'))

export default {
  name: 'PlanFormView',
  components: { ExercisesBrowser, ExerciseSetEditor },
  props: {
    planData: { type: Object, default: () => ({ id: null, name: '', datasetExercises: [], manualExercises: [] }) },
    personName: { type: String, default: '' },
    personId: { type: String, default: '' },
    adminId: { type: String, default: '' }
  },
  emits: ['saved', 'cancel'],
  data() {
    const pd = this.planData as any
    return {
      form: {
        id: pd.id || null,
        name: pd.name || '',
        datasetExercises: JSON.parse(JSON.stringify(pd.datasetExercises || [])),
        manualExercises: JSON.parse(JSON.stringify(pd.manualExercises || []))
      },
      submitted: false,
      error: '',
      saving: false,
      showBrowser: false
    }
  },
  computed: {
    adminStore() { return useAdminStore() },
    isValid(): boolean {
      const tiene = this.form.datasetExercises.length > 0 || this.form.manualExercises.length > 0
      return !!(this.form.name.trim()) && tiene
    },
    validationMessage(): string {
      const tiene = this.form.datasetExercises.length > 0 || this.form.manualExercises.length > 0
      if (!this.form.name.trim() && !tiene) return 'Ponle un nombre y agregá ejercicios'
      if (!this.form.name.trim()) return 'Ponle un nombre al plan'
      if (!tiene) return 'Agregá al menos un ejercicio'
      return ''
    }
  },
  methods: {
    translateName,
    translateCategory,
    getImgUrl(path: string): string { return `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${path}` },
    onExerciseSelected(ej: ExerciseDataset) {
      const idx = this.form.datasetExercises.findIndex((e: ExerciseDataset) => e.id === ej.id)
      if (idx >= 0) {
        this.form.datasetExercises.splice(idx, 1)
      } else {
        this.form.datasetExercises.push({ ...ej, sets: [{ weight: null, reps: null, seconds: null }] })
      }
    },
    addManual() {
      this.form.manualExercises.push({ name: '', muscleGroup: '', sets: [{ weight: null, reps: null, seconds: null }] })
    },
    async save() {
      this.submitted = true
      if (!this.isValid) return
      this.saving = true
      this.error = ''
      try {
        const todos = JSON.parse(JSON.stringify([
          ...this.form.datasetExercises.map((e: ExerciseDataset) => ({
            datasetId: e.id,
            fromDataset: true,
            sets: e.sets,
            name: e.name,
            muscleGroup: e.muscleGroup,
            category: e.category,
            target: e.target,
            equipment: e.equipment,
            gifUrl: e.gifUrl,
            image: e.image,
            videoUrl: e.videoUrl,
            instructions: e.instructions,
            isCustom: e.isCustom,
          })),
          ...this.form.manualExercises
        ]))

        const data = {
          name: this.form.name,
          exercises: todos,
          personId: this.personId,
          adminId: this.adminStore.adminId,
        }

        if (this.form.id) {
          await pb.collection('plans').update(this.form.id, data)
        } else {
          await pb.collection('plans').create(data)
        }
        this.$emit('saved')
      } catch (e) {
        console.error(e)
        this.error = 'Error al guardar'
      } finally { this.saving = false }
    }
  }
}
</script>
