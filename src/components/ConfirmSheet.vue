<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="visible" class="fixed inset-0 z-[80]" @click.self="cancelar" @keydown.escape="cancelar" role="dialog" aria-modal="true" :aria-label="titulo" ref="sheetRef">
        <div class="absolute inset-0 bg-black/40 transition-opacity" @click="cancelar" />
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl px-6 pt-4 pb-8 safe-bottom transform transition-transform" :class="visible ? 'translate-y-0' : 'translate-y-full'">
          <div class="w-10 h-1 bg-gym-gray-300 rounded-full mx-auto mb-5" aria-hidden="true" />
          <h3 class="text-lg font-bold text-gym-gray-900 text-center mb-2">{{ titulo }}</h3>
          <p v-if="mensaje" class="text-sm text-gym-gray-500 text-center mb-6 leading-relaxed">{{ mensaje }}</p>
          <div class="space-y-3">
            <button ref="confirmBtn" @click="$emit('confirmar')" class="w-full rounded-xl font-semibold text-center transition-all active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              :class="variante === 'danger' ? 'bg-red-500 text-white focus-visible:ring-red-500' : 'bg-gym-blue text-white focus-visible:ring-gym-blue'">
              {{ textoConfirmar }}
            </button>
            <button @click="cancelar" class="btn-secondary w-full">
              {{ textoCancelar }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  titulo: { type: String, required: true },
  mensaje: { type: String, default: '' },
  textoConfirmar: { type: String, default: 'Confirmar' },
  textoCancelar: { type: String, default: 'Cancelar' },
  variante: { type: String, default: 'default' }
})

const emit = defineEmits(['confirmar', 'cancelar'])

const confirmBtn = ref<HTMLButtonElement | null>(null)

watch(() => props.visible, async (val) => {
  if (val) {
    await nextTick()
    confirmBtn.value?.focus()
  }
})

function cancelar() {
  emit('cancelar')
}
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from > div:last-child,
.sheet-leave-to > div:last-child {
  transform: translateY(100%);
}
</style>
