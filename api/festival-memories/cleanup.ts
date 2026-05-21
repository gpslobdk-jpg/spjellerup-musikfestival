import {
  FESTIVAL_MEMORIES_BUCKET,
  UPLOAD_NOT_CONFIGURED_MESSAGE,
  createServiceSupabase,
  getCronSecretFromRequest,
  getErrorMessage,
  hasServerSupabaseConfig,
  jsonResponse,
  methodNotAllowed,
} from './_shared'

type ExpiredFestivalMemoryRow = {
  id: string
  storage_path: string
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return methodNotAllowed(['GET', 'POST'])
    }

    const cronSecret = process.env.CRON_SECRET?.trim()

    if (!cronSecret) {
      return jsonResponse({ error: 'CRON_SECRET er ikke sat. Cleanup er ikke aktiv endnu.' }, 503)
    }

    const providedSecret = getCronSecretFromRequest(request)

    if (providedSecret !== cronSecret) {
      return jsonResponse({ error: 'Ugyldig cleanup-adgang.' }, 401)
    }

    if (!hasServerSupabaseConfig()) {
      return jsonResponse({ error: UPLOAD_NOT_CONFIGURED_MESSAGE }, 503)
    }

    try {
      const supabase = createServiceSupabase()
      const { data, error } = await supabase
        .from('festival_memories')
        .select('id, storage_path')
        .lte('expires_at', new Date().toISOString())

      if (error) {
        throw new Error('Kunne ikke finde udløbne festivalminder.')
      }

      const expiredRows = (data ?? []) as ExpiredFestivalMemoryRow[]

      if (expiredRows.length === 0) {
        return jsonResponse({ deleted: 0 })
      }

      const storagePaths = expiredRows
        .map((row) => row.storage_path)
        .filter((path): path is string => typeof path === 'string' && path.length > 0)

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from(FESTIVAL_MEMORIES_BUCKET).remove(storagePaths)

        if (storageError) {
          throw new Error('Kunne ikke slette udløbne billeder fra storage.')
        }
      }

      const ids = expiredRows.map((row) => row.id)
      const { error: deleteError } = await supabase.from('festival_memories').delete().in('id', ids)

      if (deleteError) {
        throw new Error('Kunne ikke rydde op i metadata for udløbne festivalminder.')
      }

      return jsonResponse({ deleted: expiredRows.length })
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error, 'Cleanup mislykkedes.') }, 500)
    }
  },
}