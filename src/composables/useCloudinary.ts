const CLOUD_NAME = 'iohvfyry'
const UPLOAD_PRESET = 'gym_present'

function dataUriToBlob(dataUri: string): Blob {
  const idx = dataUri.indexOf(',')
  const meta = idx >= 0 ? dataUri.slice(0, idx) : ''
  const data = idx >= 0 ? dataUri.slice(idx + 1) : dataUri
  const mime = /^data:([^;]+)/.exec(meta)?.[1] || 'video/webm'
  const bin = atob(data)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function uploadVideo(videoBase64: string): Promise<string> {
  const blob = dataUriToBlob(videoBase64)
  const ext = blob.type.includes('webm')
    ? 'webm'
    : blob.type.includes('quicktime')
      ? 'mov'
      : 'mp4'
  const formData = new FormData()
  formData.append('file', blob, `video.${ext}`)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('resource_type', 'video')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cloudinary upload failed: ${err}`)
  }

  const data = await res.json()
  return data.secure_url
}
