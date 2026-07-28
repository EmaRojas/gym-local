<template>
  <div class="min-h-screen bg-gym-gray-100 safe-top">
    <main class="max-w-2xl mx-auto w-full px-4 sm:px-6 pt-4 pb-8 safe-bottom">
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
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
