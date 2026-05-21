import {
  FESTIVAL_MEMORIES_BUCKET,
  FESTIVAL_MEMORY_MAX_FILES,
  FESTIVAL_MEMORY_SELECT_COLUMNS,
  UPLOAD_NOT_CONFIGURED_MESSAGE,
  createServiceSupabase,
  createStoragePath,
  getErrorMessage,
  getExpiryIsoString,
  hasServerSupabaseConfig,
  isValidFestivalMemoryPath,
  jsonResponse,
  methodNotAllowed,
  normalizeStorageInfo,
  type UploadDescriptor,
  validateUploadDescriptor,
} from './_shared'

type PrepareUploadBody = {
  action: 'prepare'
  consentAccepted?: boolean
  files?: UploadDescriptor[]
}

type CompleteUploadBody = {
  action: 'complete'
  uploads?: Array<{
    path?: string
  }>
}

const isUploadDescriptor = (value: unknown): value is UploadDescriptor => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>

  return typeof candidate.name === 'string'
    && typeof candidate.size === 'number'
    && Number.isFinite(candidate.size)
    && typeof candidate.type === 'string'
}

const isCompleteUploadEntry = (value: unknown): value is { path: string } => {
  if (!value || typeof value !== 'object') return false

  return typeof (value as Record<string, unknown>).path === 'string'
}

const parseJsonBody = async (request: Request): Promise<PrepareUploadBody | CompleteUploadBody | null> => {
  try {
    return await request.json() as PrepareUploadBody | CompleteUploadBody
  } catch {
    return null
  }
}

const handlePrepareUpload = async (body: PrepareUploadBody): Promise<Response> => {
  if (!hasServerSupabaseConfig()) {
    return jsonResponse({ error: UPLOAD_NOT_CONFIGURED_MESSAGE }, 503)
  }

  if (!body.consentAccepted) {
    return jsonResponse({ error: 'Du skal acceptere reglerne før upload.' }, 400)
  }

  if (!Array.isArray(body.files) || body.files.length === 0) {
    return jsonResponse({ error: 'Vælg mindst ét billede for at uploade.' }, 400)
  }

  if (body.files.length > FESTIVAL_MEMORY_MAX_FILES) {
    return jsonResponse({ error: 'Du kan højst vælge 3 billeder ad gangen.' }, 400)
  }

  if (!body.files.every(isUploadDescriptor)) {
    return jsonResponse({ error: 'Upload-requesten er ugyldig.' }, 400)
  }

  for (const file of body.files) {
    const validationError = validateUploadDescriptor(file)

    if (validationError) {
      return jsonResponse({ error: validationError }, 400)
    }
  }

  const supabase = createServiceSupabase()
  const uploads: Array<{ path: string; token: string }> = []

  for (const file of body.files) {
    const path = createStoragePath(file)
    const { data, error } = await supabase.storage.from(FESTIVAL_MEMORIES_BUCKET).createSignedUploadUrl(path)

    if (error || !data?.token) {
      throw new Error('Uploaden kunne ikke forberedes lige nu.')
    }

    uploads.push({ path, token: data.token })
  }

  return jsonResponse({ uploads })
}

const handleCompleteUpload = async (body: CompleteUploadBody): Promise<Response> => {
  if (!hasServerSupabaseConfig()) {
    return jsonResponse({ error: UPLOAD_NOT_CONFIGURED_MESSAGE }, 503)
  }

  if (!Array.isArray(body.uploads) || body.uploads.length === 0) {
    return jsonResponse({ error: 'Der mangler upload-data for at færdiggøre billederne.' }, 400)
  }

  if (body.uploads.length > FESTIVAL_MEMORY_MAX_FILES) {
    return jsonResponse({ error: 'Der kan højst færdiggøres 3 billeder ad gangen.' }, 400)
  }

  if (!body.uploads.every(isCompleteUploadEntry)) {
    return jsonResponse({ error: 'Upload-requesten er ugyldig.' }, 400)
  }

  for (const upload of body.uploads) {
    if (!isValidFestivalMemoryPath(upload.path)) {
      return jsonResponse({ error: 'Et af billederne har en ugyldig filsti.' }, 400)
    }
  }

  const supabase = createServiceSupabase()
  const rowsToUpsert: Array<{
    consent_accepted: boolean
    expires_at: string
    file_size: number | null
    mime_type: string | null
    public_url: string
    storage_path: string
  }> = []

  for (const upload of body.uploads) {
    const { data: fileInfo, error: fileInfoError } = await supabase.storage.from(FESTIVAL_MEMORIES_BUCKET).info(upload.path)

    if (fileInfoError || !fileInfo) {
      throw new Error('Et af billederne blev ikke fundet efter uploaden.')
    }

    const { mimeType, size } = normalizeStorageInfo(fileInfo)
    const publicUrl = supabase.storage.from(FESTIVAL_MEMORIES_BUCKET).getPublicUrl(upload.path).data.publicUrl

    rowsToUpsert.push({
      consent_accepted: true,
      expires_at: getExpiryIsoString(),
      file_size: size,
      mime_type: mimeType,
      public_url: publicUrl,
      storage_path: upload.path,
    })
  }

  const { data, error } = await supabase
    .from('festival_memories')
    .upsert(rowsToUpsert, { onConflict: 'storage_path' })
    .select(FESTIVAL_MEMORY_SELECT_COLUMNS)

  if (error) {
    throw new Error('Billederne blev uploadet, men galleriet kunne ikke opdateres.')
  }

  return jsonResponse({ rows: data ?? [] })
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return methodNotAllowed(['POST'])
    }

    const body = await parseJsonBody(request)

    if (!body || typeof body !== 'object' || typeof body.action !== 'string') {
      return jsonResponse({ error: 'Upload-requesten er ugyldig.' }, 400)
    }

    try {
      if (body.action === 'prepare') {
        return await handlePrepareUpload(body as PrepareUploadBody)
      }

      if (body.action === 'complete') {
        return await handleCompleteUpload(body as CompleteUploadBody)
      }

      return jsonResponse({ error: 'Ukendt upload-handling.' }, 400)
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error, 'Der skete en fejl under uploaden.') }, 500)
    }
  },
}