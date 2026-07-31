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
            <span>{{ recordingSeconds }}s / 6s</span>
          </div>
        </div>

        <div v-if="camaraBloqueada" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 flex items-center gap-2">
          <Icon icon="ph:warning" class="w-4 h-4 flex-shrink-0" />
          <span>Permití el acceso a la cámara en tu navegador</span>
        </div>

        <div class="flex justify-center mt-4">
          <button v-if="cameraReady && !isRecording" @click="startRecording" class="btn-primary flex items-center gap-2">
            <Icon icon="ph:record" class="w-5 h-5" /> Grabar (6s máx.)
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
            <p class="text-xs text-gym-gray-400 mt-1">MP4, WebM o MOV (se convierte a GIF)</p>
          </div>
        </button>
      </div>
    </div>

    <div v-if="isProcessing" class="flex flex-col items-center gap-3 py-6">
      <Icon icon="ph:spinner" class="w-8 h-8 text-gym-blue animate-spin" />
      <span class="text-sm text-gym-gray-500">Generando GIF...</span>
    </div>

    <div v-if="result" class="text-center">
      <div class="bg-black rounded-xl overflow-hidden">
        <img :src="result" class="w-full aspect-[4/3] object-contain max-h-[300px]" />
      </div>
      <p class="text-xs text-gym-gray-400 mt-2">GIF listo ({{ sizeKB }} KB)</p>
      <div class="flex gap-3 mt-4">
        <button @click="reset" class="btn-secondary flex items-center gap-2">
          <Icon icon="ph:arrow-counter-clockwise" class="w-5 h-5" /> {{ modo === 'grabar' ? 'Volver a grabar' : 'Elegir otro' }}
        </button>
        <button @click="$emit('media-ready', { gifUrl: result, image: result })" class="btn-primary flex items-center gap-2">
          <Icon icon="ph:check" class="w-5 h-5" /> Usar GIF
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
import { GIFEncoder, quantize, applyPalette } from 'gifenc'

const FRAME_INTERVAL_MS = 166
const MAX_RECORD_SECONDS = 6
const GIF_WIDTH = 320
const GIF_HEIGHT = 240
const UPLOAD_FRAME_COUNT = 36

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
      sizeKB: 0,
      error: null as string | null,
      recordedFrames: [] as Uint8Array[],
      recordTimer: null as ReturnType<typeof setInterval> | null,
      recordingStartTime: 0,
      recordingSeconds: 0,
      captureCanvas: null as HTMLCanvasElement | null,
      captureCtx: null as CanvasRenderingContext2D | null,
    }
  },
  methods: {
    async startCamera() {
      try {
        this.error = null
        this.cameraError = false
        this.camaraBloqueada = false
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
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
      this.error = null
      this.result = null
      this.recordedFrames = []
      this.recordingSeconds = 0
      this.isRecording = true
      this.recordingStartTime = Date.now()
      this.recordTimer = setInterval(() => {
        const frame = this.captureLiveFrame()
        if (frame) this.recordedFrames.push(frame)
        this.recordingSeconds = Math.floor((Date.now() - this.recordingStartTime) / 1000)
        if (this.recordingSeconds >= MAX_RECORD_SECONDS) {
          this.stopRecording()
        }
      }, FRAME_INTERVAL_MS)
    },

    stopRecording() {
      if (this.recordTimer) {
        clearInterval(this.recordTimer)
        this.recordTimer = null
      }
      this.isRecording = false
      if (this.recordedFrames.length < 2) {
        this.error = 'No se capturaron suficientes frames.'
        return
      }
      this.processFrames(this.recordedFrames, GIF_WIDTH, GIF_HEIGHT)
    },

    captureLiveFrame(): Uint8Array | null {
      const video = this.$refs.videoEl as HTMLVideoElement
      if (!video || !video.videoWidth) return null
      if (!this.captureCanvas) {
        this.captureCanvas = document.createElement('canvas')
        this.captureCanvas.width = GIF_WIDTH
        this.captureCanvas.height = GIF_HEIGHT
        this.captureCtx = this.captureCanvas.getContext('2d')
      }
      const ctx = this.captureCtx
      if (!ctx) return null
      ctx.drawImage(video, 0, 0, GIF_WIDTH, GIF_HEIGHT)
      const img = ctx.getImageData(0, 0, GIF_WIDTH, GIF_HEIGHT)
      return new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength)
    },

    async processFrames(frames: Uint8Array[], width: number, height: number) {
      this.isProcessing = true
      try {
        const gif = await this.encodeGif(frames, width, height)
        this.result = gif
        this.sizeKB = Math.round((gif.length * 3) / 4 / 1024)
      } catch (e: any) {
        console.error(e)
        this.error = 'No se pudo generar el GIF: ' + (e?.message || '')
      } finally {
        this.isProcessing = false
      }
    },

    async encodeGif(frames: Uint8Array[], width: number, height: number): Promise<string> {
      const gif = GIFEncoder()
      for (const frame of frames) {
        const palette = quantize(frame, 256)
        const index = applyPalette(frame, palette)
        gif.writeFrame(index, width, height, { palette, delay: FRAME_INTERVAL_MS })
      }
      gif.finish()
      const bytes = new Uint8Array(gif.bytes())
      const blob = new Blob([bytes], { type: 'image/gif' })
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('No se pudo leer el GIF generado'))
        reader.readAsDataURL(blob)
      })
    },

    abrirSelector() {
      const input = this.$refs.fileInput as HTMLInputElement
      input.click()
    },

    async onFileSelected(e: Event) {
      const input = e.target as HTMLInputElement
      if (!input.files || !input.files[0]) return
      this.error = null
      const file = input.files[0]
      if (file.size > 50 * 1024 * 1024) {
        this.error = `El archivo es muy grande (${Math.round(file.size / 1024)}KB). Máx. 50MB.`
        input.value = ''
        return
      }
      this.isProcessing = true
      const src = URL.createObjectURL(file)
      try {
        const { frames, width, height } = await this.captureVideoFrames(src, UPLOAD_FRAME_COUNT)
        await this.processFrames(frames, width, height)
      } catch (err: any) {
        console.error(err)
        this.error = 'No se pudo procesar el video: ' + (err?.message || '')
      } finally {
        URL.revokeObjectURL(src)
        this.isProcessing = false
        input.value = ''
      }
    },

    async captureVideoFrames(src: string, count: number): Promise<{ frames: Uint8Array[]; width: number; height: number }> {
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = () => reject(new Error('No se pudo cargar el video'))
        video.src = src
      })
      let w = video.videoWidth || GIF_WIDTH
      let h = video.videoHeight || GIF_HEIGHT
      const scale = Math.min(GIF_WIDTH / w, GIF_HEIGHT / h, 1)
      w = Math.max(1, Math.round(w * scale))
      h = Math.max(1, Math.round(h * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      const dur = video.duration
      const positions: number[] = []
      if (isFinite(dur) && dur > 0.5) {
        const start = Math.min(0.2, dur * 0.1)
        const end = Math.max(start + 0.2, dur * 0.9)
        for (let i = 0; i < count; i++) positions.push(start + ((end - start) * i) / Math.max(1, count - 1))
      } else {
        for (let i = 0; i < count; i++) positions.push(0)
      }
      const frames: Uint8Array[] = []
      for (const t of positions) {
        if (t > 0) {
          video.currentTime = t
          await new Promise<void>((resolve) => {
            const timer = setTimeout(() => {
              video.removeEventListener('seeked', onSeeked)
              resolve()
            }, 1500)
            const onSeeked = () => {
              clearTimeout(timer)
              resolve()
            }
            video.addEventListener('seeked', onSeeked)
          })
        }
        ctx.drawImage(video, 0, 0, w, h)
        const img = ctx.getImageData(0, 0, w, h)
        frames.push(new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength))
      }
      return { frames, width: w, height: h }
    },

    reset() {
      this.result = null
      this.sizeKB = 0
      this.error = null
      this.recordedFrames = []
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
    if (this.recordTimer) clearInterval(this.recordTimer)
    this.stopCamera()
  }
}
</script>
