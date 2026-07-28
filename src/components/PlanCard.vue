<template>
  <div class="card p-4">
    <div class="flex items-center gap-3" @click="$emit('click', plan)">
      <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="editable ? 'bg-gym-blue-100' : 'bg-gym-blue'">
        <Icon icon="ph:list-checks" class="w-5 h-5" :class="editable ? 'text-gym-blue' : 'text-white'" />
      </div>
      <div class="min-w-0 flex-1 cursor-pointer">
        <h3 class="font-semibold text-gym-gray-900 truncate leading-tight">{{ plan.nombre }}</h3>
        <p class="text-xs text-gym-gray-500 mt-0.5">{{ plan.exercises?.length || 0 }} ejercicios</p>
      </div>
      <div v-if="editable" class="flex items-center gap-1.5 flex-shrink-0">
        <button @click.stop="$emit('edit', plan)" class="btn-icon bg-gym-gray-100" aria-label="Editar plan">
          <Icon icon="ph:pencil" class="w-5 h-5 text-gym-gray-500" />
        </button>
        <button @click.stop="$emit('delete', plan)" class="btn-icon bg-red-50" aria-label="Eliminar plan">
          <Icon icon="ph:trash" class="w-5 h-5 text-red-500" />
        </button>
      </div>
      <Icon v-else icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
    </div>

    <div v-if="plan.exercises && plan.exercises.length > 0 && preview" class="mt-3 pt-3 border-t border-gym-gray-100">
      <div v-for="(ej, i) in plan.exercises.slice(0, 3)" :key="i" class="flex items-center gap-2 py-1.5">
        <span class="text-xs text-gym-gray-400 w-4 tabular-nums">{{ i + 1 }}.</span>
        <span class="text-xs text-gym-gray-600 truncate">{{ traducirNombre(ej.nombre) }}</span>
        <span class="text-[10px] text-gym-gray-400 ml-auto flex-shrink-0 tabular-nums">{{ ej.sets?.length || 0 }} series</span>
      </div>
      <p v-if="plan.exercises.length > 3" class="text-[10px] text-gym-gray-400 mt-1.5">+{{ plan.exercises.length - 3 }} ejercicios más</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { traducirNombre } from '../composables/useExercises'
import type { Plan } from '../types'

defineProps<{
  plan: Plan
  editable?: boolean
  preview?: boolean
}>()

defineEmits<{
  click: [plan: Plan]
  edit: [plan: Plan]
  delete: [plan: Plan]
}>()
</script>
