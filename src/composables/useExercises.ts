import { ref, computed, watch } from 'vue'
import pb from '../db/pocketbase'
import { categories as catMap, equipment as eqMap, targets as targetMap, muscleGroups as muscleMap, translateName } from '../data/translations'
import nameTranslations from '../data/nombreTranslations'
import type { Exercise } from '../types'

const datasetResults = ref<Exercise[]>([])
const customExercises = ref<Exercise[]>([])
const searching = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('')
const equipmentFilter = ref('')
const selectedExercise = ref<Exercise | null>(null)

let searchSeq = 0
let searchTimer: ReturnType<typeof setTimeout> | null = null

function translate(valor: string, mapa: Record<string, string>): string {
  return mapa[valor] || valor
}

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

function esc(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

const categories = computed(() =>
  Object.values(catMap).sort().map(label => ({ value: label, label }))
)

const equipmentList = computed(() =>
  Object.values(eqMap).sort().map(label => ({ value: label, label }))
)

const filteredCustom = computed(() => {
  let resultado = customExercises.value
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
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

const filteredExercises = computed(() => [...datasetResults.value, ...filteredCustom.value])

const totalExercises = computed(() => datasetResults.value.length + customExercises.value.length)

function englishToSpanish(mapa: Record<string, string>, q: string, field: string, ors: string[]) {
  const lq = q.toLowerCase()
  for (const [en, es] of Object.entries(mapa)) {
    if (en.toLowerCase().includes(lq)) ors.push(`${field} = "${esc(es)}"`)
  }
}

const runSearch = async (): Promise<void> => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  const q = searchQuery.value.trim()
  const category = categoryFilter.value
  const equipment = equipmentFilter.value

  if (q.length < 4 && !category && !equipment) {
    datasetResults.value = []
    searching.value = false
    return
  }

  const seq = ++searchSeq
  searching.value = true
  try {
    const ors: string[] = ['name', 'category', 'equipment', 'target', 'muscleGroup'].map(f => `${f} ~ "${esc(q)}"`)
    if (q) {
      englishToSpanish(catMap, q, 'category', ors)
      englishToSpanish(eqMap, q, 'equipment', ors)
      englishToSpanish(targetMap, q, 'target', ors)
      englishToSpanish(muscleMap, q, 'muscleGroup', ors)
      const lq = q.toLowerCase()
      const nameHits: string[] = []
      for (const [en, es] of Object.entries(nameTranslations)) {
        if (en.toLowerCase().includes(lq)) nameHits.push(es)
      }
      for (const es of nameHits.slice(0, 40)) ors.push(`name ~ "${esc(es)}"`)
    }
    const conds = [`(${ors.join(' || ')})`, 'isCustom = false']
    if (category) conds.push(`category = "${esc(category)}"`)
    if (equipment) conds.push(`equipment = "${esc(equipment)}"`)

    const result = await pb.collection('exercises').getList(1, 100, {
      filter: conds.join(' && '),
      sort: 'name',
      fields: 'id,name,category,equipment,target,muscleGroup,gifUrl,image,videoUrl,isCustom',
    })
    if (seq === searchSeq) {
      datasetResults.value = result.items as unknown as Exercise[]
    }
  } catch {
    if (seq === searchSeq) datasetResults.value = []
  } finally {
    if (seq === searchSeq) searching.value = false
  }
}

watch([searchQuery, categoryFilter, equipmentFilter], () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void runSearch()
  }, 350)
})

const loadCustomExercises = async (adminId: string): Promise<void> => {
  try {
    const records = await pb.collection('exercises').getFullList({
      filter: `isCustom = true && adminId = "${adminId}"`,
      sort: 'name',
    })
    customExercises.value = records as unknown as Exercise[]
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

export function useExercises() {
  return {
    searchQuery,
    categoryFilter,
    equipmentFilter,
    categories,
    equipmentList,
    filteredExercises,
    totalExercises,
    searching,
    customExercises,
    loadCustomExercises,
    selectedExercise,
    selectExercise,
    clearSelection,
    clearFilters,
  }
}
