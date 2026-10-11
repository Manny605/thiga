import { supabase } from './supabaseClient'

const BUCKET = 'avatars'
const SIZE = 512
export const AVATAR_MAX_BYTES = 8 * 1024 * 1024
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp'

/** URL publique de la photo, ou null : le composant Avatar retombe alors sur les initiales. */
export function avatarUrl(path) {
  if (!path) return null
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/**
 * Recadre au centre en carré de 512 px et réencode : une photo de téléphone
 * de 4 Mo devient ~40 Ko, et l'orientation EXIF est appliquée par le navigateur.
 */
async function toSquare(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  canvas.getContext('2d').drawImage(
    bitmap,
    (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side,
    0, 0, SIZE, SIZE
  )
  bitmap.close()

  // Safari ancien ne sait pas encoder en WebP : il renvoie du PNG, d'où le repli.
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  if (blob?.type === 'image/webp') return blob
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
}

/** Convention de chemin imposée par les policies et le trigger : `<user_id>/<fichier>`. */
export async function uploadAvatar(userId, file, previousPath) {
  const blob = await toSquare(file)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  // Nom horodaté : une URL neuve à chaque changement, donc pas de cache périmé.
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: false, contentType: blob.type, cacheControl: '31536000' })
  if (upErr) throw upErr

  const { error: profErr } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', userId)
  if (profErr) {
    await supabase.storage.from(BUCKET).remove([path])
    throw profErr
  }

  if (previousPath && previousPath !== path) await supabase.storage.from(BUCKET).remove([previousPath])
  return path
}

/** Retire la photo du profil puis le fichier. Sert aussi à l'admin (modération). */
export async function removeAvatar(userId, path) {
  const { error } = await supabase.from('profiles').update({ avatar_path: null }).eq('id', userId)
  if (error) throw error
  if (path) await supabase.storage.from(BUCKET).remove([path])
}

/** Message d'erreur si le fichier ne convient pas, sinon null. */
export function describeAvatarProblem(file, t) {
  if (!file) return null
  if (!AVATAR_ACCEPT.split(',').includes(file.type)) return t('avatar.errorType')
  if (file.size > AVATAR_MAX_BYTES) return t('avatar.errorTooLarge')
  return null
}
