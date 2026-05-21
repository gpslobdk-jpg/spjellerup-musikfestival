import { createClient } from '@supabase/supabase-js'

export const FESTIVAL_MEMORIES_BUCKET = 'festival-memories'
export const FESTIVAL_MEMORY_FOLDER = 'festival-2026'
export const FESTIVAL_MEMORY_MAX_FILES = 3
export const FESTIVAL_MEMORY_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const FESTIVAL_MEMORY_RETENTION_DAYS = 10
export const UPLOAD_NOT_CONFIGURED_MESSAGE = 'Upload er ikke konfigureret endnu.'
export const FESTIVAL_MEMORY_SELECT_COLUMNS = 'id, storage_path, public_url, file_size, mime_type, created_at, expires_at, consent_accepted'

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export type UploadDescriptor = {
  name: string
  type: string
  size: number
}

export const jsonResponse = (body: unknown, status = 200): Response => (
  new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    status,
  })
)

export const methodNotAllowed = (allowedMethods: string[]): Response => (
  new Response(JSON.stringify({ error: 'Metoden er ikke tilladt.' }), {
    headers: {
      Allow: allowedMethods.join(', '),
      'Content-Type': 'application/json; charset=utf-8',
    },
    status: 405,
  })
)

export const hasServerSupabaseConfig = (): boolean => (
  Boolean(process.env.VITE_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
)

export const createServiceSupabase = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(UPLOAD_NOT_CONFIGURED_MESSAGE)
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export const validateUploadDescriptor = (descriptor: UploadDescriptor): string | null => {
  if (!descriptor.type.startsWith('image/')) {
    return 'Kun billedfiler kan uploades.'
  }

  if (descriptor.size > FESTIVAL_MEMORY_MAX_FILE_SIZE_BYTES) {
    return 'Hvert billede må maks fylde 5 MB.'
  }

  return null
}

export const isValidFestivalMemoryPath = (path: string): boolean => {
  const pathPattern = new RegExp(`^${FESTIVAL_MEMORY_FOLDER}\\/[0-9a-f-]{36}\\.[a-z0-9]+$`, 'i')

  return pathPattern.test(path)
}

const sanitizeExtension = (value: string): string | null => {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9]/g, '')

  if (!sanitized || sanitized.length > 8) {
    return null
  }

  return sanitized
}

const getExtensionFromFileName = (fileName: string): string | null => {
  const extension = fileName.split('.').pop()

  if (!extension || extension === fileName) {
    return null
  }

  return sanitizeExtension(extension)
}

const getExtensionFromMimeType = (mimeType: string): string | null => {
  return MIME_EXTENSION_MAP[mimeType] ?? null
}

export const createStoragePath = (descriptor: UploadDescriptor): string => {
  const extension = getExtensionFromFileName(descriptor.name) ?? getExtensionFromMimeType(descriptor.type) ?? 'jpg'

  return `${FESTIVAL_MEMORY_FOLDER}/${crypto.randomUUID()}.${extension}`
}

export const getExpiryIsoString = (): string => (
  new Date(Date.now() + FESTIVAL_MEMORY_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
)

export const getCronSecretFromRequest = (request: Request): string | null => {
  const requestUrl = new URL(request.url)
  const querySecret = requestUrl.searchParams.get('secret')

  if (querySecret) {
    return querySecret
  }

  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  return authHeader.slice('Bearer '.length).trim()
}

export const normalizeStorageInfo = (info: unknown): { size: number | null; mimeType: string | null } => {
  const normalizedInfo = info as {
    contentType?: string
    metadata?: {
      mimetype?: string
      size?: number
    }
    size?: number
  } | null

  return {
    mimeType: normalizedInfo?.metadata?.mimetype ?? normalizedInfo?.contentType ?? null,
    size: typeof normalizedInfo?.metadata?.size === 'number'
      ? normalizedInfo.metadata.size
      : typeof normalizedInfo?.size === 'number'
        ? normalizedInfo.size
        : null,
  }
}