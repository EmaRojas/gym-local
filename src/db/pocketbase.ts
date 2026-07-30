import PocketBase from 'pocketbase'

function getPbUrl(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('pb_url')
    if (stored) return stored
  }
  return import.meta.env.VITE_PB_URL || 'https://desktop-qbakpb3.taild1df84.ts.net'
}

const pb = new PocketBase(getPbUrl())

export function setPbUrl(url: string) {
  localStorage.setItem('pb_url', url)
  pb.baseUrl = url
}

export default pb
