const CLOUD_NAME = 'iohvfyry'
const UPLOAD_PRESET = 'gym_present'

export async function uploadVideo(videoBase64: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', videoBase64)
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
