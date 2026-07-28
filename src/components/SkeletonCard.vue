<template>
  <div class="card p-4 animate-pulse">
    <div class="flex items-center gap-3">
      <div class="rounded-full bg-gym-gray-200" :class="avatarClass" />
      <div class="flex-1 space-y-2.5">
        <div class="h-4 bg-gym-gray-200 rounded w-3/4" />
        <div class="h-3 bg-gym-gray-200 rounded w-1/2" />
      </div>
      <div v-if="trailing" class="h-4 bg-gym-gray-200 rounded w-8" />
    </div>
    <div v-if="lines > 0" class="mt-3 pt-3 border-t border-gym-gray-100 space-y-2.5">
      <div v-for="i in lines" :key="i" class="h-3 bg-gym-gray-200 rounded" :style="{ width: `${60 + Math.random() * 30}%` }" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  avatarClass: { type: String, default: 'w-11 h-11' },
  trailing: { type: Boolean, default: false },
  lines: { type: Number, default: 0 }
})
</script>
