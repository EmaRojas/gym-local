<template>
  <div>
    <div class="flex gap-2 mb-4">
      <button @click="modo = 'grabar'" class="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
        :class="modo === 'grabar' ? 'bg-gym-blue text-white' : 'bg-gym-gray-100 text-gym-gray-600'">
        <Icon icon="ph:video-camera" class="w-4 h-4 inline mr-1.5" /> Grabar
      </button>
      <button @click="modo = 'subir'" class="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
        :class="modo === 'subir' ? 'bg-gym-blue text-white' : 'bg-gym-gray-100 text-gym-gray-600'">
        <Icon icon="ph:upload" class="w-4 h-4 inline mr-1.5" /> Subir video
      </button>
    </div>

    <div v-if="!result">
      <div v-show="modo === 'grabar'">
        <div class="relative bg-black rounded-xl overflow-hidden">
          <video ref="videoEl" autoplay muted playsinline class="w-full aspect-[4/3] object-cover" />
          <div v-if="!cameraReady && !cameraError" class="absolute inset-0 flex items-center justify-center bg-gym-gray-900">
            <Icon icon="ph:camera" class="w-8 h-8 text-gym-gray-500" />
          </div>
          <div v-if="isRecording" class="absolute top-3 left-3 flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
            <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>{{ recordingSeconds }}s / 8s</span>
          </div>
        </div>

        <div v-if="camaraBloqueada" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 flex items-center gap-2">
          <Icon icon="ph:warning" class="w-4 h-4 flex-shrink-0" />
          <span>Permití el acceso a la cámara en tu navegador</span>
        </div>

        <div class="flex justify-center mt-4">
          <button v-if="cameraReady && !isRecording" @click="startRecording" class="btn-primary flex items-center gap-2">
            <Icon icon="ph:record" class="w-5 h-5" /> Grabar (8s máx.)
          </button>
          <button v-if="isRecording" @click="stopRecording" class="btn bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-6 min-h-[44px] rounded-xl font-semibold transition-colors">
            <Icon icon="ph:stop-fill" class="w-5 h-5" /> Detener
          </button>
        </div>
      </div>

      <div v-show="modo === 'subir'">
        <button type="button" @click="abrirSelector" class="card card-hover p-8 flex flex-col items-center gap-3 w-full">
          <div class="w-16 h-16 bg-gym-blue-100 rounded-2xl flex items-center justify-center">
            <Icon icon="ph:film-strip" class="w-8 h-8 text-gym-blue" />
          </div>
          <div class="text-center">
            <p class="font-semibold text-gym-gray-700">Tocá para seleccionar un video</p>
            <p class="text-xs text-gym-gray-400 mt-1">MP4, WebM o MOV (máx. 900KB, ~5s)</p>
          </div>
        </button>
      </div>
    </div>

    <div v-if="isProcessing" class="flex flex-col items-center gap-3 py-6">
      <Icon icon="ph:spinner" class="w-8 h-8 text-gym-blue animate-spin" />
      <span class="text-sm text-gym-gray-500">Procesando video...</span>
    </div>

    <div v-if="result" class="text-center">
      <div class="bg-black rounded-xl overflow-hidden">
        <video :src="result" :playbackRate="0.5" autoplay muted loop playsinline class="w-full aspect-[4/3] object-contain max-h-[300px]" />
      </div>
      <p class="text-xs text-gym-gray-400 mt-2">Video listo ({{ sizeKB }} KB)</p>
      <div class="flex gap-3 mt-4">
        <button @click="reset" class="btn-secondary flex items-center gap-2">
          <Icon icon="ph:arrow-counter-clockwise" class="w-5 h-5" /> {{ modo === 'grabar' ? 'Volver a grabar' : 'Elegir otro' }}
        </button>
        <button @click="$emit('media-ready', { videoBase64: videoBase64 || result, image: thumbnail })" class="btn-primary flex items-center gap-2">
          <Icon icon="ph:check" class="w-5 h-5" /> Usar video
        </button>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-500 text-center mt-3 flex items-center gap-2 justify-center">
      <Icon icon="ph:warning-circle" class="w-4 h-4" /> {{ error }}
    </p>

    <input ref="fileInput" type="file" accept="video/*" class="sr-only" @change="onFileSelected" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'GifRecorder',
  emits: ['media-ready'],
  data() {
    return {
      modo: 'grabar' as 'grabar' | 'subir',
      stream: null as MediaStream | null,
      cameraReady: false,
      cameraError: false,
      camaraBloqueada: false,
      isRecording: false,
      isProcessing: false,
      result: null as string | null,
      videoBase64: null as string | null,
      thumbnail: null as string | null,
      sizeKB: 0,
      error: null as string | null,
      mediaRecorder: null as MediaRecorder | null,
      recordingChunks: [] as Blob[],
      recordingStartTime: 0,
      recordingTimer: null as ReturnType<typeof setInterval> | null,
      recordingSeconds: 0,
    }
  },
  methods: {
    async startCamera() {
      try {
        this.error = null
        this.cameraError = false
        this.camaraBloqueada = false
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 240 }, height: { ideal: 180 } },
          audio: false
        })
        this.stream = mediaStream
        const video = this.$refs.videoEl as HTMLVideoElement
        video.srcObject = mediaStream
        await video.play()
        this.cameraReady = true
      } catch (e: any) {
        this.cameraError = true
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          this.camaraBloqueada = true
          this.error = 'Acceso a cámara denegado. Permitilo desde la configuración del navegador.'
        } else {
          this.error = 'No se pudo acceder a la cámara. ' + (e.message || '')
        }
      }
    },

    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop())
        this.stream = null
      }
      this.cameraReady = false
    },

    startRecording() {
      if (!this.stream) return
      if (typeof MediaRecorder === 'undefined') {
        this.error = 'Tu navegador no soporta grabación de video. Probá con Chrome o Edge.'
        return
      }
      this.error = null
      this.result = null
      this.recordingChunks = []
      this.recordingSeconds = 0
      this.isRecording = true

      try {
        this.mediaRecorder = new MediaRecorder(this.stream, {
          mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
            ? 'video/webm;codecs=vp8'
            : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
              ? 'video/webm;codecs=vp9'
              : 'video/webm'
        })
      } catch (e) {
        this.error = 'Error al iniciar grabación: ' + ((e as Error).message || '')
        this.isRecording = false
        return
      }

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordingChunks.push(e.data)
      }

      this.mediaRecorder.onstop = () => {
        this.processRecording()
      }

      this.mediaRecorder.start(100)
      this.recordingStartTime = Date.now()

      this.recordingTimer = setInterval(() => {
        this.recordingSeconds = Math.floor((Date.now() - this.recordingStartTime) / 1000)
        if (this.recordingSeconds >= 8) {
          this.stopRecording()
        }
      }, 200)
    },

    stopRecording() {
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer)
        this.recordingTimer = null
      }
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop()
      }
      this.isRecording = false
    },

    processRecording() {
      if (this.recordingChunks.length === 0) {
        this.error = 'No se grabó ningún video.'
        return
      }
      this.isProcessing = true
      const blob = new Blob(this.recordingChunks, { type: 'video/webm' })
      this.sizeKB = Math.round(blob.size / 1024)
      this.result = URL.createObjectURL(blob)
      const reader = new FileReader()
      reader.onload = async () => {
        this.videoBase64 = reader.result as string
        try {
          this.thumbnail = await this.capturarFrame(this.result!)
        } catch {
          this.thumbnail = null
        }
        this.isProcessing = false
      }
      reader.onerror = () => {
        this.error = 'Error al leer el video'
        this.isProcessing = false
      }
      reader.readAsDataURL(blob)
    },

    abrirSelector() {
      const input = this.$refs.fileInput as HTMLInputElement
      input.click()
    },

    onFileSelected(e: Event) {
      const input = e.target as HTMLInputElement
      if (!input.files || !input.files[0]) return
      this.error = null
      this.isProcessing = true

      const file = input.files[0]
      if (file.size > 10 * 1024 * 1024) {
        this.error = `El archivo es muy grande (${Math.round(file.size / 1024)}KB). Máx. 10MB.`
        this.isProcessing = false
        return
      }

      this.sizeKB = Math.round(file.size / 1024)
      this.result = URL.createObjectURL(file)
      const reader = new FileReader()
      reader.onload = async () => {
        this.videoBase64 = reader.result as string
        try {
          this.thumbnail = await this.capturarFrame(this.result!)
        } catch {
          this.thumbnail = null
        }
        this.isProcessing = false
      }
      reader.onerror = () => {
        this.error = 'Error al leer el video'
        this.isProcessing = false
      }
      reader.readAsDataURL(file)
      input.value = ''
    },

    capturarFrame(videoSrc: string): Promise<string> {
      return new Promise((resolve) => {
        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true
        video.preload = 'auto'

        let resolved = false

        const finish = () => {
          if (resolved) return
          resolved = true
          const maxW = 320
          const w = video.videoWidth > 0 ? Math.min(maxW, video.videoWidth) : 320
          const h = video.videoHeight > 0 ? Math.round(w * video.videoHeight / video.videoWidth) : 240
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')!
          try { ctx.drawImage(video, 0, 0, w, h) } catch {}
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }

        const timeout = setTimeout(finish, 1500)

        video.onloadeddata = () => {
          clearTimeout(timeout)
          const t = isFinite(video.duration) && video.duration > 0
            ? Math.min(0.5, video.duration / 2)
            : 0
          if (t > 0) {
            video.currentTime = t
            video.onseeked = finish
            const seekTimeout = setTimeout(finish, 1000)
            const origFinish = finish
            video.onseeked = () => {
              clearTimeout(seekTimeout)
              origFinish()
            }
          } else {
            finish()
          }
        }
        video.onerror = finish
        video.src = videoSrc
      })
    },

    reset() {
      if (this.result) URL.revokeObjectURL(this.result)
      this.result = null
      this.videoBase64 = null
      this.thumbnail = null
      this.sizeKB = 0
      this.error = null
      this.recordingChunks = []
    }
  },
  watch: {
    modo(val: string) {
      if (val === 'grabar') {
        this.startCamera()
      } else {
        this.stopCamera()
      }
    }
  },
  mounted() {
    if (this.modo === 'grabar') this.startCamera()
  },
  beforeUnmount() {
    if (this.recordingTimer) clearInterval(this.recordingTimer)
    if (this.result) URL.revokeObjectURL(this.result)
    this.stopCamera()
  }
}
</script>
