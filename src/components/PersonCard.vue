<template>
  <button @click="$emit('click', person)" class="card card-hover p-4 flex items-center gap-3.5 w-full text-left">
    <div class="w-11 h-11 bg-gym-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
      <span class="text-sm font-bold text-gym-blue">{{ iniciales }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="font-semibold text-gym-gray-900 truncate leading-tight">{{ person.name }} {{ person.lastName }}</h3>
      <p class="text-xs text-gym-gray-500 mt-0.5">DNI: {{ person.dni }}</p>
    </div>
    <div class="text-right flex-shrink-0">
      <div class="text-sm font-bold text-gym-blue tabular-nums">{{ planCount }}</div>
      <div class="text-[10px] text-gym-gray-500">planes</div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  person: { type: Object, required: true },
  planCount: { type: Number, default: 0 }
})

defineEmits(['click'])

const iniciales = computed(() => {
  return (((props.person.name || '')[0] || '') + ((props.person.lastName || '')[0] || '')).toUpperCase()
})
</script>
