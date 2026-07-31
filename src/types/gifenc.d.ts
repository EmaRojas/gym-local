declare module 'gifenc' {
  export interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: {
        palette?: Uint8Array
        delay?: number
        transparent?: boolean
        transparentIndex?: number
        dispose?: number
        repeat?: number
      }
    ): void
    finish(): void
    bytes(): Uint8Array
    reset(): void
  }

  export function GIFEncoder(): GIFEncoderInstance
  export function quantize(rgba: Uint8Array, maxColors: number): Uint8Array
  export function applyPalette(rgba: Uint8Array, palette: Uint8Array, format?: 'rgb565' | 'rgba4444'): Uint8Array
}
