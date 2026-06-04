import { useEffect, useId, useRef, useState } from 'react'

import { isSupabaseConfigured, supabase } from './lib/supabaseClient'

const FESTIVAL_MEMORY_MAX_FILES = 3
const FESTIVAL_MEMORY_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const FESTIVAL_MEMORY_RETENTION_DAYS = 10
const FESTIVAL_MEMORY_CONFIG_MESSAGE = 'Upload er ikke konfigureret endnu. Tjek Supabase-indstillinger.'
const FESTIVAL_MEMORY_EMPTY_MESSAGE = 'Billeder vises her, når festivalen er i gang.'
const FESTIVAL_MEMORY_COLUMNS = 'id, storage_path, public_url, file_size, mime_type, created_at, expires_at, consent_accepted'

const festivalMemoriesGalleryPlaceholders = [
  'Hovedscenen',
  'Festivalpladsen',
  'Fællessang',
  'Mad og boder',
  'Festivalvenner',
  'Dagens finale',
]

type FestivalMemoryRow = {
  id: string
  storage_path: string
  public_url: string
  file_size: number | null
  mime_type: string | null
  created_at: string
  expires_at: string
  consent_accepted: boolean
}

type FestivalMemory = {
  id: string
  storagePath: string
  publicUrl: string
  fileSize: number | null
  mimeType: string | null
  createdAt: string
  expiresAt: string
  consentAccepted: boolean
}

type PendingFestivalMemory = {
  id: string
  file: File
  previewUrl: string
}

type PreparedFestivalUpload = {
  path: string
  token: string
}

type FestivalMemoriesGalleryState = {
  memories: FestivalMemory[]
  isLoading: boolean
  error: string | null
  prependMemories: (incoming: FestivalMemory[]) => void
}

type FestivalMemoryPageProps = {
  onBackHome: () => void
  onOpenLegal: () => void
}

type FestivalLegalPageProps = {
  onBackToMemories: () => void
}

type UploadPrepareResponse = {
  uploads?: PreparedFestivalUpload[]
  error?: string
}

type UploadCompleteResponse = {
  rows?: FestivalMemoryRow[]
  error?: string
}

const mapFestivalMemory = (row: FestivalMemoryRow): FestivalMemory => ({
  id: row.id,
  storagePath: row.storage_path,
  publicUrl: row.public_url,
  fileSize: row.file_size,
  mimeType: row.mime_type,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  consentAccepted: row.consent_accepted,
})

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

const formatFestivalMemoryDate = (value: string): string => (
  new Intl.DateTimeFormat('da-DK', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value))
)

const formatFestivalMemorySize = (size: number | null): string | null => {
  if (!size) return null

  const megabytes = size / (1024 * 1024)

  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`
}

const mergeFestivalMemories = (incoming: FestivalMemory[], current: FestivalMemory[]): FestivalMemory[] => {
  const mergedById = new Map<string, FestivalMemory>()

  for (const memory of [...incoming, ...current]) {
    mergedById.set(memory.id, memory)
  }

  return [...mergedById.values()].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

const validateSelectedFiles = (files: File[]): string | null => {
  if (files.length === 0) {
    return 'Vælg mindst ét billede for at uploade.'
  }

  if (files.length > FESTIVAL_MEMORY_MAX_FILES) {
    return 'Du kan højst vælge 3 billeder ad gangen.'
  }

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return 'Du kan kun vælge billedfiler.'
    }

    if (file.size > FESTIVAL_MEMORY_MAX_FILE_SIZE_BYTES) {
      return `${file.name} er for stort. Hvert billede må maks fylde 5 MB.`
    }
  }

  return null
}

const readJsonResponse = async <T,>(response: Response): Promise<T | null> => {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

const fetchFestivalMemories = async (): Promise<FestivalMemory[]> => {
  if (!supabase) {
    throw new Error(FESTIVAL_MEMORY_CONFIG_MESSAGE)
  }

  const { data, error } = await supabase
    .from('festival_memories')
    .select(FESTIVAL_MEMORY_COLUMNS)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Kunne ikke hente festivalminder lige nu.')
  }

  return ((data ?? []) as FestivalMemoryRow[]).map(mapFestivalMemory)
}

const prepareFestivalUpload = async (
  files: File[],
  consentAccepted: boolean,
): Promise<PreparedFestivalUpload[]> => {
  const response = await fetch('/api/festival-memories/upload', {
    body: JSON.stringify({
      action: 'prepare',
      consentAccepted,
      files: files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const payload = await readJsonResponse<UploadPrepareResponse>(response)

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Uploaden kunne ikke forberedes lige nu.')
  }

  if (!payload?.uploads || payload.uploads.length !== files.length) {
    throw new Error('Uploaden kunne ikke forberedes lige nu.')
  }

  return payload.uploads
}

const completeFestivalUpload = async (paths: string[]): Promise<FestivalMemory[]> => {
  const response = await fetch('/api/festival-memories/upload', {
    body: JSON.stringify({
      action: 'complete',
      uploads: paths.map((path) => ({ path })),
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const payload = await readJsonResponse<UploadCompleteResponse>(response)

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Billederne kunne ikke færdiggøres i galleriet.')
  }

  return ((payload?.rows ?? []) as FestivalMemoryRow[]).map(mapFestivalMemory)
}

const useFestivalMemoriesGallery = (): FestivalMemoriesGalleryState => {
  const [memories, setMemories] = useState<FestivalMemory[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    let intervalId: number | null = null

    const loadMemories = async (showLoading: boolean) => {
      if (!isSupabaseConfigured) {
        if (isActive) {
          setError(null)
          setIsLoading(false)
          setMemories([])
        }

        return
      }

      if (showLoading && isActive) {
        setIsLoading(true)
      }

      try {
        const nextMemories = await fetchFestivalMemories()

        if (!isActive) return

        setError(null)
        setMemories(nextMemories)
      } catch (error) {
        if (!isActive) return

        setError(getErrorMessage(error, 'Kunne ikke hente festivalminder lige nu.'))
      } finally {
        if (showLoading && isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadMemories(true)

    if (typeof window !== 'undefined' && isSupabaseConfigured) {
      intervalId = window.setInterval(() => {
        void loadMemories(false)
      }, 30000)
    }

    return () => {
      isActive = false

      if (intervalId !== null && typeof window !== 'undefined') {
        window.clearInterval(intervalId)
      }
    }
  }, [])

  const prependMemories = (incoming: FestivalMemory[]) => {
    setMemories((currentMemories) => mergeFestivalMemories(incoming, currentMemories))
  }

  return {
    error,
    isLoading,
    memories,
    prependMemories,
  }
}

const FestivalMemoryLightbox = ({
  memory,
  onClose,
}: {
  memory: FestivalMemory | null
  onClose: () => void
}) => {
  useEffect(() => {
    if (!memory) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [memory, onClose])

  if (!memory) return null

  return (
    <div className="modal-overlay memories-lightbox" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="modal-content memories-lightbox__content" role="dialog" aria-modal="true" aria-label="Festivalminde i stor visning">
        <button className="modal-close" onClick={onClose} aria-label="Luk festivalminde">✕</button>
        <img className="memories-lightbox__image" src={memory.publicUrl} alt="Festivalminde i stor visning" />
        <div className="memories-lightbox__caption">
          <strong className="memories-lightbox__caption-title">Festivalminde</strong>
          <span>Uploadet {formatFestivalMemoryDate(memory.createdAt)}</span>
          <span>Billeder slettes igen efter senest {FESTIVAL_MEMORY_RETENTION_DAYS} dage.</span>
        </div>
      </div>
    </div>
  )
}

const FestivalMemoryPlaceholderCard = ({ label, index, text }: { label: string; index: number; text: string }) => (
  <article className={`memories-gallery-card memories-gallery-card--accent-${(index % 3) + 1}`}>
    <div className="memories-gallery-card__visual" aria-hidden="true">
      <span className="memories-gallery-card__spark"></span>
      <span className="memories-gallery-card__spark"></span>
      <span className="memories-gallery-card__spark"></span>
    </div>
    <div className="memories-gallery-card__body">
      <div className="memories-gallery-card__label">{label}</div>
      <p>{text}</p>
    </div>
  </article>
)

const FestivalMemoryGalleryCard = ({
  memory,
  onOpen,
}: {
  memory: FestivalMemory
  onOpen: (memory: FestivalMemory) => void
}) => (
  <article className="memories-gallery-card memories-gallery-card--image">
    <button className="memories-gallery-card__image-button" onClick={() => onOpen(memory)} type="button">
      <img className="memories-gallery-card__image" src={memory.publicUrl} alt="Festivalminde fra festivaldagen" loading="lazy" />
    </button>

    <div className="memories-gallery-card__body">
      <div className="memories-gallery-card__label">Festivalminde</div>
      <p>Uploadet {formatFestivalMemoryDate(memory.createdAt)}</p>
      {formatFestivalMemorySize(memory.fileSize) && <div className="memories-gallery-card__meta">{formatFestivalMemorySize(memory.fileSize)}</div>}
    </div>
  </article>
)

const FestivalMemoriesDesktopGallery = ({
  memories,
  isLoading,
  onOpen,
}: {
  memories: FestivalMemory[]
  isLoading: boolean
  onOpen: (memory: FestivalMemory) => void
}) => {
  if (isLoading) {
    return (
      <section className="memories-gallery-grid memories-gallery-grid--live" aria-label="Festivalminder galleri loader">
        {festivalMemoriesGalleryPlaceholders.map((label, index) => (
          <FestivalMemoryPlaceholderCard key={`${label}-loading`} label={label} index={index} text="Henter festivalminder..." />
        ))}
      </section>
    )
  }

  if (memories.length === 0) {
    return (
      <section className="memories-gallery-grid memories-gallery-grid--live" aria-label="Festivalminder galleri placeholder">
        {festivalMemoriesGalleryPlaceholders.map((label, index) => (
          <FestivalMemoryPlaceholderCard key={label} label={label} index={index} text={FESTIVAL_MEMORY_EMPTY_MESSAGE} />
        ))}
      </section>
    )
  }

  return (
    <section className="memories-gallery-grid memories-gallery-grid--live" aria-label="Festivalminder galleri">
      {memories.map((memory) => (
        <FestivalMemoryGalleryCard key={memory.id} memory={memory} onOpen={onOpen} />
      ))}
    </section>
  )
}

const FestivalMemoriesMobileGallery = ({
  memories,
  isLoading,
  onOpen,
}: {
  memories: FestivalMemory[]
  isLoading: boolean
  onOpen: (memory: FestivalMemory) => void
}) => (
  <section className="memories-card memories-card--gallery-stack">
    <div className="memories-card__header">
      <h2>Seneste festivalminder</h2>
      <p>Billeder kan blive vist offentligt på festivalhjemmesiden og slettes efter senest 10 dage.</p>
    </div>

    {isLoading ? (
      <div className="memories-gallery-grid memories-gallery-grid--mobile" aria-label="Festivalminder loader">
        {festivalMemoriesGalleryPlaceholders.slice(0, 4).map((label, index) => (
          <FestivalMemoryPlaceholderCard key={`${label}-mobile-loading`} label={label} index={index} text="Henter festivalminder..." />
        ))}
      </div>
    ) : memories.length === 0 ? (
      <p className="memories-gallery-empty">{FESTIVAL_MEMORY_EMPTY_MESSAGE}</p>
    ) : (
      <div className="memories-gallery-grid memories-gallery-grid--mobile" aria-label="Seneste festivalminder">
        {memories.slice(0, 6).map((memory) => (
          <FestivalMemoryGalleryCard key={memory.id} memory={memory} onOpen={onOpen} />
        ))}
      </div>
    )}
  </section>
)

export const FestivalMemoriesDesktopPage = ({ onBackHome, onOpenLegal }: FestivalMemoryPageProps) => {
  const { memories, isLoading, error } = useFestivalMemoriesGallery()
  const [lightboxMemory, setLightboxMemory] = useState<FestivalMemory | null>(null)
  const notice = !isSupabaseConfigured ? FESTIVAL_MEMORY_CONFIG_MESSAGE : error

  return (
    <>
      <main className="memories-page memories-page--desktop">
        <div className="memories-page__shell memories-page__shell--desktop">
          <section className="memories-gallery-hero">
            <div className="memories-gallery-hero__top">
              <div className="badge">Offentligt galleri</div>
              <button className="btn outline memories-gallery-hero__back" onClick={onBackHome} type="button">
                Tilbage til forsiden
              </button>
            </div>

            <h1 className="memories-page__title">Festivalminder</h1>
            <p className="memories-page__subtitle">Her kan I se billeder fra festivaldagen</p>
            <p className="memories-gallery-hero__lead">
              Når festivalen er i gang, kan elever og deltagere uploade deres 3 bedste billeder fra mobilen.
              Billederne kan derefter blive vist her på festivalhjemmesiden.
            </p>
          </section>

          {notice && (
            <section className="memories-card memories-card--notice">
              <p>{notice}</p>
            </section>
          )}

          <FestivalMemoriesDesktopGallery memories={memories} isLoading={isLoading} onOpen={setLightboxMemory} />

          <section className="memories-gallery-footer">
            <div className="memories-card memories-card--info">
              <h2>Praktisk info</h2>
              <p>Billeder slettes igen efter senest 10 dage.</p>
            </div>

            <button className="btn outline memories-link memories-link--desktop" onClick={onOpenLegal} type="button">
              Læs om billeder og GDPR
            </button>
          </section>
        </div>
      </main>

      <FestivalMemoryLightbox memory={lightboxMemory} onClose={() => setLightboxMemory(null)} />
    </>
  )
}

export const FestivalMemoriesPage = ({ onBackHome, onOpenLegal }: FestivalMemoryPageProps) => {
  const { memories, isLoading, error, prependMemories } = useFestivalMemoriesGallery()
  const [selectedMemories, setSelectedMemories] = useState<PendingFestivalMemory[]>([])
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [lightboxMemory, setLightboxMemory] = useState<FestivalMemory | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const consentId = useId()
  const galleryNotice = !isSupabaseConfigured ? FESTIVAL_MEMORY_CONFIG_MESSAGE : error

  useEffect(() => {
    return () => {
      for (const selectedMemory of selectedMemories) {
        URL.revokeObjectURL(selectedMemory.previewUrl)
      }
    }
  }, [selectedMemories])

  const handleChooseFiles = () => {
    setSelectionError(null)
    setSuccessMessage(null)

    if (!isSupabaseConfigured) {
      setUploadError(FESTIVAL_MEMORY_CONFIG_MESSAGE)
      return
    }

    if (isUploading) return

    setUploadError(null)
    fileInputRef.current?.click()
  }

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? [])
    event.target.value = ''

    setSelectionError(null)
    setUploadError(null)
    setSuccessMessage(null)

    if (nextFiles.length === 0) {
      return
    }

    const validationError = validateSelectedFiles(nextFiles)

    if (validationError) {
      setSelectionError(validationError)
      return
    }

    setSelectedMemories(
      nextFiles.map((file) => ({
        file,
        id: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
      })),
    )
  }

  const handleUpload = async () => {
    const files = selectedMemories.map((memory) => memory.file)
    const validationError = validateSelectedFiles(files)

    setUploadError(null)
    setSuccessMessage(null)

    if (!isSupabaseConfigured) {
      setUploadError(FESTIVAL_MEMORY_CONFIG_MESSAGE)
      return
    }

    if (validationError) {
      setUploadError(validationError)
      return
    }

    if (!consentAccepted) {
      setUploadError('Sæt flueben ved samtykke, før du uploader.')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setSuccessMessage(null)

    try {
      const preparedUploads = await prepareFestivalUpload(files, consentAccepted)

      if (!supabase) {
        throw new Error(FESTIVAL_MEMORY_CONFIG_MESSAGE)
      }

      for (const [index, preparedUpload] of preparedUploads.entries()) {
        const file = files[index]

        const { error } = await supabase.storage
          .from('festival-memories')
          .uploadToSignedUrl(preparedUpload.path, preparedUpload.token, file, {
            cacheControl: '3600',
            contentType: file.type,
          })

        if (error) {
          throw new Error('Et af billederne kunne ikke uploades. Prøv igen om lidt.')
        }
      }

      const completedMemories = await completeFestivalUpload(preparedUploads.map((preparedUpload) => preparedUpload.path))

      prependMemories(completedMemories)
      setConsentAccepted(false)
      setSelectedMemories([])
      setSuccessMessage(
        completedMemories.length === 1
          ? 'Dit billede er uploadet og vises nu i galleriet.'
          : 'Dine billeder er uploadet og vises nu i galleriet.',
      )

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setUploadError(getErrorMessage(error, 'Uploaden lykkedes ikke. Prøv igen om lidt.'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <main className="memories-page">
        <div className="memories-page__shell">
          <header className="memories-topbar">
            <button className="btn outline memories-topbar__back" onClick={onBackHome} type="button">
              Tilbage til forsiden
            </button>

            <div className="memories-topbar__meta">Festivalminder</div>
            <h1 className="memories-page__title">Festivalminder</h1>
            <p className="memories-page__subtitle">Del dine 3 bedste billeder fra festivalen</p>
          </header>

          <section className="memories-card memories-card--intro">
            <p>
              Når du uploader billeder, kan de blive vist på festivalhjemmesiden, så andre kan se minderne fra dagen.
            </p>
            <p className="memories-card__text-muted">Vælg kun billeder, du selv synes er gode, rare og ordentlige.</p>
          </section>

          <section className="memories-card memories-card--rules">
            <h2>Sådan passer vi på hinanden</h2>

            <ul className="memories-rules">
              <li>Del kun gode festivalbilleder.</li>
              <li>Upload ikke billeder, der kan gøre andre kede af det.</li>
              <li>Spørg altid, hvis du er i tvivl om nogen vil være med på billedet.</li>
              <li>Upload kun billeder, som gerne må vises på festivalhjemmesiden.</li>
              <li>Billederne slettes igen efter 10 dage.</li>
              <li>Kontakt skolen, hvis et billede ønskes fjernet før.</li>
            </ul>
          </section>

          <button className="btn outline memories-link" onClick={onOpenLegal} type="button">
            Læs om billeder og GDPR
          </button>

          {galleryNotice && (
            <section className="memories-card memories-card--notice">
              <p>{galleryNotice}</p>
            </section>
          )}

          <section className="memories-card memories-card--upload">
            <button
              className="memories-upload__status"
              disabled={isUploading}
              onClick={handleChooseFiles}
              type="button"
            >
              {isUploading ? 'Billederne uploades...' : 'Upload billeder'}
            </button>

            <div className="memories-card__header">
              <h2>Vælg op til 3 billeder</h2>
              <p>Upload kun ordentlige billeder, hvor personer gerne vil være med. Hvert billede må maks fylde 5 MB.</p>
            </div>

            <button
              className="btn outline memories-upload__picker"
              disabled={isUploading}
              onClick={handleChooseFiles}
              type="button"
            >
              <span className="memories-upload__picker-copy">
                {isUploading ? 'Billederne uploades...' : 'Vælg billeder'}
              </span>
            </button>
            <input
              ref={fileInputRef}
              accept="image/*"
              disabled={!isSupabaseConfigured || isUploading}
              hidden
              multiple
              onChange={handleFileSelection}
              type="file"
            />

            <p className="memories-upload__help">
              Vælg op til 3 billeder. Billederne kan blive vist offentligt på festivalhjemmesiden og slettes efter senest 10 dage.
            </p>

            {selectedMemories.length > 0 && (
              <div className="memories-upload__selected-count">
                {selectedMemories.length} {selectedMemories.length === 1 ? 'billede er valgt' : 'billeder er valgt'}
              </div>
            )}

            {selectionError && <p className="memories-upload__message memories-upload__message--error">{selectionError}</p>}
            {uploadError && <p className="memories-upload__message memories-upload__message--error">{uploadError}</p>}
            {successMessage && <p className="memories-upload__message memories-upload__message--success">{successMessage}</p>}

            {selectedMemories.length > 0 && (
              <div className="memories-preview-grid" aria-label="Forhåndsvisning af valgte billeder">
                {selectedMemories.map((memory) => (
                  <article key={memory.id} className="memories-preview-card">
                    <img className="memories-preview-card__thumb" src={memory.previewUrl} alt="Forhåndsvisning af valgt billede" />
                    <div className="memories-preview-card__body">
                      <div className="memories-preview-card__name">{memory.file.name}</div>
                      <div className="memories-preview-card__meta">{formatFestivalMemorySize(memory.file.size) ?? 'Billede'}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <label className="memories-upload__consent" htmlFor={consentId}>
              <input
                checked={consentAccepted}
                className="memories-upload__checkbox"
                disabled={!isSupabaseConfigured || isUploading}
                id={consentId}
                onChange={(event) => setConsentAccepted(event.target.checked)}
                type="checkbox"
              />
              <span>
                Jeg bekræfter, at billederne må vises på festivalhjemmesiden i op til 10 dage, og at jeg har valgt billeder,
                der er gode, rare og ordentlige.
              </span>
            </label>

            <div className="memories-upload__actions">
              <button
                className="btn primary memories-upload__button"
                disabled={isUploading}
                onClick={handleUpload}
                type="button"
              >
                {isUploading ? 'Uploader billeder...' : 'Upload billeder'}
              </button>
            </div>

            <p className="memories-upload__note">Kontakt skolen, hvis et billede ønskes fjernet tidligere.</p>
            <p className="memories-upload__expiry">Billeder slettes igen efter senest 10 dage.</p>
          </section>

          <FestivalMemoriesMobileGallery memories={memories} isLoading={isLoading} onOpen={setLightboxMemory} />
        </div>
      </main>

      <FestivalMemoryLightbox memory={lightboxMemory} onClose={() => setLightboxMemory(null)} />
    </>
  )
}

export const FestivalLegalPage = ({ onBackToMemories }: FestivalLegalPageProps) => (
  <main className="legal-page">
    <div className="legal-page__shell">
      <header className="legal-page__hero">
        <button className="btn outline legal-page__back" onClick={onBackToMemories} type="button">
          Tilbage til Festivalminder
        </button>

        <div className="legal-page__eyebrow">Praktisk information</div>
        <h1 className="legal-page__title">Billeder, samtykke og GDPR</h1>
      </header>

      <section className="legal-card">
        <p>
          På Spjellerup Musikfestival kan deltagere senere få mulighed for at uploade billeder fra festivaldagen.
          Billederne kan blive vist offentligt på festivalhjemmesiden i en kort periode.
        </p>

        <p>
          Upload kun billeder, hvor du vurderer, at personerne på billedet gerne vil være med. Upload ikke billeder
          fra private, sårbare eller ubehagelige situationer.
        </p>

        <p>Ved upload bekræfter du, at billedet må vises på festivalhjemmesiden i op til 10 dage.</p>

        <p>
          Billederne bruges kun til at dele stemningsfulde minder fra festivalen. De bruges ikke til reklamer,
          videresælges ikke og deles ikke med andre tjenester.
        </p>

        <p>Billeder slettes igen efter senest 10 dage.</p>

        <p>
          Hvis du eller dine forældre ønsker et billede fjernet tidligere, kan I kontakte skolen, så billedet kan blive
          fjernet.
        </p>
      </section>

      <section className="legal-card legal-card--note">
        <p>Denne side er en praktisk informationstekst og ikke juridisk rådgivning.</p>
      </section>
    </div>
  </main>
)
