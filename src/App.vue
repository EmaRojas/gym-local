<template>
  <div class="min-h-screen safe-top overflow-x-hidden" :style="{ backgroundColor: 'var(--gym-bg)' }">
    <div v-if="!isOnline" class="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white text-center py-1.5 text-xs font-semibold">
      Sin conexión — los datos pueden no estar actualizados
    </div>

    <div v-if="needsUpdate" class="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-sm">
      <div class="bg-gym-gray-900 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3">
        <Icon icon="ph:arrow-circle-down" class="w-6 h-6 text-gym-blue flex-shrink-0" />
        <p class="text-sm flex-1">Nueva versión disponible</p>
        <button @click="updateApp" class="bg-gym-blue text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gym-blue-600 transition-colors">
          Actualizar
        </button>
      </div>
    </div>

    <button
      @click="toggleDark"
      class="fixed top-3 right-3 z-50 btn-icon bg-gym-gray-100 border border-gym-gray-200 shadow-sm"
      :aria-label="isDark ? 'Modo claro' : 'Modo oscuro'"
    >
      <Icon v-if="isDark" icon="ph:sun" class="w-5 h-5 text-gym-gray-600" />
      <Icon v-else icon="ph:moon" class="w-5 h-5 text-gym-gray-600" />
    </button>

    <main class="max-w-4xl lg:max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-8 safe-bottom">
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <template v-if="Component">
            <component :is="Component" />
          </template>
          <div v-else class="flex items-center justify-center min-h-[60vh]">
            <Icon icon="ph:spinner" class="w-8 h-8 text-gym-blue animate-spin" />
          </div>
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useOnlineStatus } from './composables/useOnlineStatus'
import { usePWAUpdate } from './composables/usePWAUpdate'

const { isOnline } = useOnlineStatus()
const { needsUpdate, updateApp } = usePWAUpdate()

const isDark = ref(false)

function applyDark(val: boolean) {
  isDark.value = val
  document.documentElement.classList.toggle('dark', val)
  localStorage.setItem('darkMode', val ? '1' : '0')
}

function toggleDark() {
  applyDark(!isDark.value)
}

onMounted(() => {
  const stored = localStorage.getItem('darkMode')
  if (stored === '1') {
    applyDark(true)
  } else if (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyDark(true)
  }
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
