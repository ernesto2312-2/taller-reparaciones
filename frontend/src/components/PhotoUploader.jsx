import { useRef, useState } from 'react'
import { Icon } from './Icon'
import { getFotoUrl } from '../services/ordenes'
import { formatFileSize } from '../utils/format'

const MAX_PHOTOS = 3
const MAX_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const ACCEPT_ATTR = 'image/jpeg,image/png,image/gif'

function NewPhotoPreview({ file, onRemove }) {
  const [url] = useState(() => URL.createObjectURL(file))

  return (
    <div className="photo-tile">
      {url ? (
        <img
          src={url}
          alt={`Vista previa de ${file.name}`}
          onLoad={() => URL.revokeObjectURL(url)}
          onError={() => URL.revokeObjectURL(url)}
        />
      ) : null}
      <div className="photo-tile__bar">
        <span className="photo-tile__name" title={file.name}>
          {file.name}
        </span>
        <span className="photo-tile__size">{formatFileSize(file.size)}</span>
      </div>
      <button
        type="button"
        className="photo-tile__remove"
        onClick={() => onRemove(file)}
        aria-label={`Quitar ${file.name}`}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  )
}

export default function PhotoUploader({
  ordenId,
  existing = [],
  removed = [],
  onRemoveExisting,
  onRestoreExisting,
  newFiles = [],
  onAddFiles,
  onRemoveNew,
  error,
}) {
  const inputRef = useRef(null)
  const [localError, setLocalError] = useState('')

  const visibleExisting = existing.filter((filename) => !removed.includes(filename))
  const total = visibleExisting.length + newFiles.length
  const limitReached = total >= MAX_PHOTOS

  const handleFiles = (fileList) => {
    const files = Array.from(fileList ?? [])
    if (files.length === 0) return

    const problems = []
    const accepted = []

    files.forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        problems.push(`${file.name}: solo se aceptan JPG, PNG o GIF.`)
      } else if (file.size > MAX_SIZE) {
        problems.push(`${file.name}: supera el máximo de 5 MB.`)
      } else {
        accepted.push(file)
      }
    })

    if (total + accepted.length > MAX_PHOTOS) {
      setLocalError(`Puede adjuntar como máximo ${MAX_PHOTOS} fotos por orden.`)
      return
    }

    setLocalError(problems.join(' '))
    if (accepted.length > 0) {
      onAddFiles(accepted)
    }
  }

  return (
    <div className="photo-uploader">
      <div className="photo-uploader__header">
        <div>
          <p className="photo-uploader__title">Fotos del equipo</p>
          <p className="photo-uploader__hint">Hasta 3 imágenes JPG, PNG o GIF de 5 MB como máximo.</p>
        </div>
        <span className={`photo-uploader__counter ${limitReached ? 'is-full' : ''}`.trim()}>
          {total} / {MAX_PHOTOS}
        </span>
      </div>

      <div className="photo-grid photo-grid--editable">
        {visibleExisting.map((filename, index) => (
          <div className="photo-tile" key={filename}>
            <img
              src={getFotoUrl(ordenId, filename, { thumb: '320x240' })}
              alt={`Foto ${index + 1} guardada`}
              loading="lazy"
            />
            <div className="photo-tile__bar">
              <span className="photo-tile__name">Foto guardada</span>
            </div>
            <button
              type="button"
              className="photo-tile__remove"
              onClick={() => onRemoveExisting(filename)}
              aria-label={`Quitar foto guardada ${index + 1}`}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}

        {newFiles.map((file) => (
          <NewPhotoPreview key={`${file.name}-${file.lastModified}`} file={file} onRemove={onRemoveNew} />
        ))}

        {!limitReached ? (
          <button
            type="button"
            className="photo-add"
            onClick={() => inputRef.current?.click()}
          >
            <Icon name="camera" size={22} />
            <span>Añadir foto</span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="visually-hidden"
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />

      {removed.length > 0 ? (
        <div className="photo-removed">
          <span>
            {removed.length === 1
              ? 'Se eliminará 1 foto al guardar.'
              : `Se eliminarán ${removed.length} fotos al guardar.`}
          </span>
          <div className="photo-removed__list">
            {removed.map((filename) => (
              <button
                key={filename}
                type="button"
                className="photo-removed__item"
                onClick={() => onRestoreExisting(filename)}
              >
                Deshacer
                <Icon name="refresh" size={14} />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error || localError ? (
        <p className="field__error" role="alert">
          {error || localError}
        </p>
      ) : null}
    </div>
  )
}
