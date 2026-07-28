import { ref, computed } from 'vue'
import { categorias as catMap, equipos as eqMap, targets as targetMap, muscleGroups as muscleMap, traducirNombre } from '../data/translations'
import type { Exercise } from '../types'

const exercisesData = ref<Exercise[]>([])
const exercisesLoaded = ref(false)

function traducir(valor: string, mapa: Record<string, string>): string {
  return mapa[valor] || valor
}

const categorias = computed(() => {
  const cats = [...new Set(exercisesData.value.map(e => e.category))]
  return cats.sort().map(c => ({ value: c, label: traducir(c, catMap) }))
})

const equipos = computed(() => {
  const eqs = [...new Set(exercisesData.value.map(e => e.equipment))]
  return eqs.sort().map(e => ({ value: e, label: traducir(e, eqMap) }))
})

const totalEjercicios = computed(() => exercisesData.value.length)

export function traducirCategoria(cat: string): string {
  return traducir(cat, catMap)
}

export function traducirEquipo(eq: string): string {
  return traducir(eq, eqMap)
}

export function traducirTarget(target: string): string {
  return traducir(target, targetMap)
}

export function traducirMuscleGroup(muscle: string): string {
  return traducir(muscle, muscleMap)
}

export { traducirNombre }

export function useExercises() {
  const busqueda = ref('')
  const filtroCategoria = ref('')
  const filtroEquipo = ref('')
  const ejercicioSeleccionado = ref<Exercise | null>(null)

  const ejerciciosFiltrados = computed(() => {
    let resultado = exercisesData.value

    if (busqueda.value.trim()) {
      const q = busqueda.value.toLowerCase().trim()
      resultado = resultado.filter(e =>
        e.name.toLowerCase().includes(q) ||
        traducirNombre(e.name).toLowerCase().includes(q) ||
        traducir(e.category, catMap).toLowerCase().includes(q) ||
        traducir(e.equipment, eqMap).toLowerCase().includes(q) ||
        traducir(e.target, targetMap).toLowerCase().includes(q) ||
        traducir(e.muscle_group, muscleMap).toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.equipment.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        e.muscle_group.toLowerCase().includes(q)
      )
    }

    if (filtroCategoria.value) {
      resultado = resultado.filter(e => e.category === filtroCategoria.value)
    }

    if (filtroEquipo.value) {
      resultado = resultado.filter(e => e.equipment === filtroEquipo.value)
    }

    return resultado
  })

  const cargarEjercicios = async (): Promise<void> => {
    if (exercisesLoaded.value) return
    const data = await import('../data/exercises.json')
    exercisesData.value = data.default || data
    exercisesLoaded.value = true
  }

  const seleccionarEjercicio = (ejercicio: Exercise): void => {
    ejercicioSeleccionado.value = ejercicio
  }

  const limpiarSeleccion = (): void => {
    ejercicioSeleccionado.value = null
  }

  const limpiarFiltros = (): void => {
    busqueda.value = ''
    filtroCategoria.value = ''
    filtroEquipo.value = ''
  }

  return {
    exercises: exercisesData,
    exercisesLoaded,
    cargarEjercicios,
    busqueda,
    filtroCategoria,
    filtroEquipo,
    ejercicioSeleccionado,
    categorias,
    equipos,
    ejerciciosFiltrados,
    totalEjercicios,
    seleccionarEjercicio,
    limpiarSeleccion,
    limpiarFiltros
  }
}
