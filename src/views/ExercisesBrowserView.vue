<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-5 flex-shrink-0">
      <button @click="$emit('back')" class="btn-icon bg-gym-gray-100 flex-shrink-0" aria-label="Volver">
        <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">Ejercicios</h1>
        <p class="text-sm text-gym-gray-500 mt-0.5 tabular-nums">{{ filteredExercises.length }} de {{ totalExercises }}</p>
      </div>
      <span v-if="seleccionados.length > 0" class="text-sm font-bold text-gym-blue bg-gym-blue-100 px-3 py-1.5 rounded-full tabular-nums flex-shrink-0">
        {{ seleccionados.length }} sel.
      </span>
    </div>

    <!-- Búsqueda -->
    <div class="relative mb-3 flex-shrink-0">
      <Icon icon="ph:magnifying-glass" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gym-gray-400" aria-hidden="true" />
      <input
        v-model="searchQuery"
        type="text"
        class="input-field-sm pl-12"
        style="font-size: 16px"
        placeholder="Buscar ejercicio..."
        aria-label="Buscar ejercicio"
      />
    </div>

    <!-- Filtros -->
    <div class="flex gap-2 mb-3 flex-shrink-0">
      <div class="flex-1 min-w-0">
        <label for="filter-category" class="sr-only">Filtrar por parte del cuerpo</label>
        <select id="filter-category" v-model="categoryFilter" class="select-field" style="font-size: 16px">
          <option value="">Todas las partes</option>
          <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
        </select>
      </div>
      
      <div class="flex-1 min-w-0">
        <label for="filter-equipment" class="sr-only">Filtrar por equipo</label>
        <select id="filter-equipment" v-model="equipmentFilter" class="select-field" style="font-size: 16px">
          <option value="">Todo el equipo</option>
          <option v-for="eq in equipmentList" :key="eq.value" :value="eq.value">{{ eq.label }}</option>
        </select>
      </div>

      <button type="button" @click="clearFilters" class="btn-sm text-gym-blue px-3 flex-shrink-0" aria-label="Limpiar filtros">
        Limpiar
      </button>
    </div>

    <!-- Lista de ejercicios -->
    <div class="flex-1 overflow-y-auto -mx-4 px-4">
      <div v-if="!exercisesLoaded" class="text-center py-12">
        <Icon icon="ph:spinner" class="w-8 h-8 text-gym-blue mx-auto mb-3 animate-spin" />
        <p class="text-sm text-gym-gray-400">Cargando ejercicios...</p>
      </div>
      <div v-else-if="!mostrarResultados" class="text-center py-12">
        <Icon icon="ph:keyboard" class="w-10 h-10 text-gym-gray-300 mx-auto mb-3" />
        <p class="text-sm text-gym-gray-400">Escribí al menos 4 caracteres o seleccioná un filtro</p>
      </div>
      <div v-else-if="filteredExercises.length === 0" class="text-center py-12">
        <Icon icon="ph:magnifying-glass" class="w-10 h-10 text-gym-gray-300 mx-auto mb-3" />
        <p class="text-sm text-gym-gray-400">No se encontraron ejercicios</p>
      </div>

      <div v-else class="divide-y divide-gym-gray-100">
        <div 
          v-for="exercise in filteredExercises" 
          :key="exercise.id"
          @click="select(exercise)"
          @keydown.enter="select(exercise)"
          @keydown.space.prevent="select(exercise)"
          role="button"
          tabindex="0"
          class="w-full flex items-center gap-3 py-3.5 active:bg-gym-gray-50 transition-colors cursor-pointer"
          :class="seleccionados.some(e => e.id === exercise.id) ? 'bg-gym-blue-50' : ''"
          :aria-label="`${translateName(exercise.name)}, ${translateCategory(exercise.category)}, ${translateEquipment(exercise.equipment)}${seleccionados.some(e => e.id === exercise.id) ? ', seleccionado' : ''}`"
          :aria-pressed="seleccionados.some(e => e.id === exercise.id)"
        >
          <!-- Check icon -->
          <div class="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
               :class="seleccionados.some(e => e.id === exercise.id) ? 'bg-gym-blue border-gym-blue' : 'border-gym-gray-300'">
            <Icon v-if="seleccionados.some(e => e.id === exercise.id)" icon="ph:check" class="w-4 h-4 text-white" />
          </div>

          <!-- Mini preview -->
          <button v-if="exercise.videoUrl" @click.stop="gifPreview = exercise" class="w-12 h-12 rounded-xl overflow-hidden bg-gym-gray-100 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-gym-blue focus-visible:outline-none" :aria-label="`Ver video de ${translateName(exercise.name)}`">
            <video :src="exercise.videoUrl" :playbackRate="exercise.isCustom ? 0.5 : 1" muted playsinline class="w-full h-full object-cover" />
          </button>
          <button v-else-if="exercise.gifUrl" @click.stop="gifPreview = exercise" class="w-12 h-12 rounded-xl overflow-hidden bg-gym-gray-100 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-gym-blue focus-visible:outline-none" :aria-label="`Ver gif de ${translateName(exercise.name)}`">
            <img :src="getImgUrl(exercise.gifUrl)" :alt="exercise.name" class="w-full h-full object-cover" loading="lazy" />
          </button>
          <button v-else-if="exercise.image" @click.stop="gifPreview = exercise" class="w-12 h-12 rounded-xl overflow-hidden bg-gym-gray-100 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-gym-blue focus-visible:outline-none" aria-label="Ver imagen">
            <img :src="exercise.image" :alt="exercise.name" class="w-full h-full object-cover" loading="lazy" />
          </button>
          <div v-else class="w-12 h-12 rounded-xl overflow-hidden bg-gym-gray-100 flex-shrink-0 flex items-center justify-center">
            <Icon icon="ph:barbell" class="w-5 h-5 text-gym-gray-400" />
          </div>

          <!-- Texto -->
          <div class="min-w-0 flex-1">
            <h3 class="text-sm font-medium text-gym-gray-900 truncate leading-tight">
              {{ translateName(exercise.name) }}
              <span v-if="exercise.isCustom" class="inline-block text-[10px] font-semibold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded ml-1 align-middle">Personalizado</span>
            </h3>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="text-[10px] px-1.5 py-0.5 bg-gym-gray-100 text-gym-gray-600 rounded">{{ translateCategory(exercise.category) }}</span>
              <span class="text-[10px] text-gym-gray-400">{{ translateEquipment(exercise.equipment) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón fijo abajo -->
    <div v-if="seleccionados.length > 0" class="flex-shrink-0 pt-3 border-t border-gym-gray-200 safe-bottom">
      <button @click="$emit('back')" class="btn-primary w-full text-base font-bold" aria-label="Confirmar selección de ejercicios">
        Listo ({{ seleccionados.length }} ejercicio{{ seleccionados.length > 1 ? 's' : '' }})
      </button>
    </div>

    <!-- Preview GIF modal -->
    <div v-if="gifPreview" ref="previewRef" class="fixed inset-0 z-[70] flex items-center justify-center p-6" @click="gifPreview = null" @keydown="trapPreviewFocus" role="dialog" aria-modal="true" :aria-label="`Vista previa de ${gifPreview.name}`">
      <div class="absolute inset-0 bg-black/60"></div>
      <div class="relative max-w-md w-full" @click.stop>
        <div class="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <video v-if="gifPreview.videoUrl" :src="gifPreview.videoUrl" :playbackRate="gifPreview.isCustom ? 0.5 : 1" autoplay muted loop playsinline class="w-full object-contain bg-gym-gray-50 max-h-[60vh]" />
          <img v-else-if="gifPreview.gifUrl" :src="getImgUrl(gifPreview.gifUrl)" :alt="gifPreview.name" class="w-full object-contain bg-gym-gray-50 max-h-[60vh]" />
          <img v-else-if="gifPreview.image" :src="gifPreview.image" :alt="gifPreview.name" class="w-full object-contain bg-gym-gray-50 max-h-[60vh]" />
          <div class="p-4">
            <h3 class="font-bold text-gym-gray-900 text-base leading-tight">{{ translateName(gifPreview.name) }}</h3>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="text-xs px-2 py-0.5 bg-gym-gray-100 text-gym-gray-600 rounded">{{ translateCategory(gifPreview.category) }}</span>
              <span class="text-xs text-gym-gray-400">{{ translateEquipment(gifPreview.equipment) }}</span>
            </div>
          </div>
        </div>
        <button @click="gifPreview = null" class="absolute -top-2 -right-2 btn-icon bg-white shadow-lg" aria-label="Cerrar vista previa">
          <Icon icon="ph:x" class="w-5 h-5 text-gym-gray-600" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useExercises, translateCategory, translateEquipment, translateName } from '../composables/useExercises'
import type { Exercise } from '../types'

export default {
  name: 'ExercisesBrowserView',
  props: {
    seleccionados: {
      type: Array as () => Exercise[],
      default: () => [] as Exercise[]
    },
    adminId: {
      type: String,
      default: ''
    }
  },
  emits: ['select', 'back'],
  setup(props: { seleccionados: Exercise[]; adminId: string }, { emit }: { emit: (event: 'select' | 'back', ...args: any[]) => void }) {
    const {
      searchQuery,
      categoryFilter,
      equipmentFilter,
      categories,
      equipmentList,
      filteredExercises,
      totalExercises,
      exercisesLoaded,
      loadExercises,
      clearFilters
    } = useExercises()

    onMounted(() => {
      if (mostrarResultados.value) loadExercises(props.adminId || undefined)
    })
    watch(
      [searchQuery, categoryFilter, equipmentFilter],
      () => {
        if (mostrarResultados.value && !exercisesLoaded.value) {
          loadExercises(props.adminId || undefined)
        }
      }
    )

    const mostrarResultados = computed(() =>
      searchQuery.value.length >= 4 || !!categoryFilter.value || !!equipmentFilter.value
    )

    const gifPreview = ref<Exercise | null>(null)
    const previewRef = ref<HTMLDivElement | null>(null)

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gifPreview.value) {
        gifPreview.value = null
      }
    }
    onMounted(() => window.addEventListener('keydown', onKeydown))
    onUnmounted(() => window.removeEventListener('keydown', onKeydown))

    function trapPreviewFocus(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !previewRef.value) return
      const focusable = previewRef.value.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    const select = (exercise: Exercise) => {
      emit('select', exercise)
    }

    const getImgUrl = (path: string) => {
      return `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${path}`
    }

    return {
      searchQuery,
      categoryFilter,
      equipmentFilter,
      categories,
      equipmentList,
      filteredExercises,
      totalExercises,
      exercisesLoaded,
      clearFilters,
      select,
      mostrarResultados,
      translateCategory,
      translateEquipment,
      translateName,
      getImgUrl,
      gifPreview,
      previewRef,
      trapPreviewFocus
    }
  }
}
</script>
