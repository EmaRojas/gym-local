import { ref, onMounted } from 'vue'

export function usePWAUpdate() {
  const needsUpdate = ref(false)
  let registration: ServiceWorkerRegistration | null = null

  onMounted(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((reg) => {
      registration = reg
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            needsUpdate.value = true
          }
        })
      })
    })
  })

  function updateApp() {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  return { needsUpdate, updateApp }
}
