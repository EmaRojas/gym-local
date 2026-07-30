import { ref, computed } from 'vue'
import pb from '../db/pocketbase'
import { categories as catMap, equipment as eqMap, targets as targetMap, muscleGroups as muscleMap, translateName } from '../data/translations'
import type { Exercise } from '../types'

const exercisesData = ref<Exercise[]>([])
const exercisesLoaded = ref(false)

function translate(valor: string, mapa: Record<string, string>): string {
  return mapa[valor] || valor
}

const categories = computed(() => {
  const cats = [...new Set(exercisesData.value.map(e => e.category))]
  return cats.sort().map(c => ({ value: c, label: translate(c, catMap) }))
})

const equipmentList = computed(() => {
  const eqs = [...new Set(exercisesData.value.map(e => e.equipment))]
  return eqs.sort().map(e => ({ value: e, label: translate(e, eqMap) }))
})

const totalExercises = computed(() => exercisesData.value.length)

export function translateCategory(cat: string): string {
  return translate(cat, catMap)
}

export function translateEquipment(eq: string): string {
  return translate(eq, eqMap)
}

export function translateTarget(target: string): string {
  return translate(target, targetMap)
}

export function translateMuscleGroup(muscle: string): string {
  return translate(muscle, muscleMap)
}

export { translateName }

export function useExercises() {
  const searchQuery = ref('')
  const categoryFilter = ref('')
  const equipmentFilter = ref('')
  const selectedExercise = ref<Exercise | null>(null)

  const filteredExercises = computed(() => {
    let resultado = exercisesData.value

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      resultado = resultado.filter(e =>
        e.name.toLowerCase().includes(q) ||
        translateName(e.name).toLowerCase().includes(q) ||
        translate(e.category, catMap).toLowerCase().includes(q) ||
        translate(e.equipment, eqMap).toLowerCase().includes(q) ||
        translate(e.target, targetMap).toLowerCase().includes(q) ||
        translate(e.muscleGroup, muscleMap).toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.equipment.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        e.muscleGroup.toLowerCase().includes(q)
      )
    }

    if (categoryFilter.value) {
      resultado = resultado.filter(e => e.category === categoryFilter.value)
    }

    if (equipmentFilter.value) {
      resultado = resultado.filter(e => e.equipment === equipmentFilter.value)
    }

    return resultado
  })

  const loadExercises = async (adminId?: string): Promise<void> => {
    if (!exercisesLoaded.value) {
      try {
        const records = await pb.collection('exercises').getFullList({
          filter: 'isCustom = false'
        })
        if (records.length) {
          exercisesData.value = records as unknown as Exercise[]
          exercisesLoaded.value = true
        }
      } catch {
        // offline — exercisesData queda vacío
      }
    }

    if (adminId) {
      await loadCustomExercises(adminId)
    }
  }

  const loadCustomExercises = async (adminId: string): Promise<void> => {
    try {
      const records = await pb.collection('exercises').getFullList({
        filter: `isCustom = true && adminId = "${adminId}"`
      })
      const customExercises: Exercise[] = records as unknown as Exercise[]
      exercisesData.value = [
        ...exercisesData.value.filter(e => e.isCustom !== true),
        ...customExercises,
      ]
    } catch {
      // offline
    }
  }

  const selectExercise = (exercise: Exercise): void => {
    selectedExercise.value = exercise
  }

  const clearSelection = (): void => {
    selectedExercise.value = null
  }

  const clearFilters = (): void => {
    searchQuery.value = ''
    categoryFilter.value = ''
    equipmentFilter.value = ''
  }

  return {
    exercises: exercisesData,
    exercisesLoaded,
    loadExercises,
    loadCustomExercises,
    searchQuery,
    categoryFilter,
    equipmentFilter,
    selectedExercise,
    categories,
    equipmentList,
    filteredExercises,
    totalExercises,
    selectExercise,
    clearSelection,
    clearFilters,
  }
}