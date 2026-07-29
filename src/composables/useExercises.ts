import { ref, computed } from 'vue'
import { collection, getDocs, query, where } from 'firebase/firestore'
import dbFirebase from '../db/firebase'
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

  const cargarEjercicios = async (adminId?: string): Promise<void> => {
    if (!exercisesLoaded.value) {
      let fromFirestore = false
      try {
        const q = query(
          collection(dbFirebase, 'ejercicios'),
          where('es_personalizado', '==', false)
        )
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
          const defaults: Exercise[] = snapshot.docs.map(d => ({
            ...(d.data() as Exercise),
            id: d.id,
          }))
          exercisesData.value = defaults
          exercisesLoaded.value = true
          fromFirestore = true
        }
      } catch {
        // Firestore fallo, usar JSON local
      }

      if (!fromFirestore) {
        const data = await import('../data/exercises.json')
        exercisesData.value = (data.default || data).map((e: any) => ({
          ...e,
          es_personalizado: false,
          adminId: null,
          video_base64: null,
        }))
        exercisesLoaded.value = true
      }
    }

    if (adminId) {
      await cargarPersonalizados(adminId)
    }
  }

  function agregarAEjercicios(ej: Exercise): void {
    exercisesData.value = [
      ...exercisesData.value.filter(e => e.id !== ej.id),
      ej,
    ]
  }

  const cargarPersonalizados = async (adminId: string): Promise<void> => {
    try {
      const q = query(
        collection(dbFirebase, 'ejercicios'),
        where('es_personalizado', '==', true),
        where('adminId', '==', adminId)
      )
      const snapshot = await getDocs(q)
      const personales: Exercise[] = snapshot.docs.map(d => ({
        ...(d.data() as Exercise),
        id: d.id,
      }))
      exercisesData.value = [
        ...exercisesData.value.filter(e => e.es_personalizado !== true),
        ...personales,
      ]
    } catch {
      // offline
    }
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
    cargarPersonalizados,
    busqueda,
    filtroCategoria,
    filtroEquipo,
    ejercicioSeleccionado,
    categorias,
    equipos,
    ejerciciosFiltrados,
    totalEjercicios,
    agregarAEjercicios,
    seleccionarEjercicio,
    limpiarSeleccion,
    limpiarFiltros,
  }
}
