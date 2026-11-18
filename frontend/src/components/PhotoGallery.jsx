import { useState } from 'react'
import Modal from './Modal'
import { getFotoUrl } from '../services/ordenes'

export default function PhotoGallery({ ordenId, fotos = [] }) {
  const [selected, setSelected] = useState(null)

  if (fotos.length === 0) {
    return (
      <p className="photo-gallery__empty">
        <span aria-hidden="true">📷</span> Todavía no hay fotos del equipo.
      </p>
    )
  }

  return (
    <>
      <div className="photo-grid">
        {fotos.map((filename, index) => (
          <button
            type="button"
            className="photo-tile photo-tile--button"
            key={filename}
            onClick={() => setSelected(filename)}
            aria-label={`Ampliar foto ${index + 1}`}
          >
            <img
              src={getFotoUrl(ordenId, filename, { thumb: '480x360' })}
              alt={`Foto ${index + 1} del equipo`}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Foto del equipo"
        size="lg"
      >
        {selected ? (
          <img
            className="photo-full"
            src={getFotoUrl(ordenId, selected)}
            alt="Foto ampliada del equipo"
          />
        ) : null}
      </Modal>
    </>
  )
}
