import Modal from './Modal'
import Button from './Button'
import { Icon } from './Icon'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  danger = true,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={`confirm-box ${danger ? 'confirm-box--danger' : ''}`.trim()}>
        <span className="confirm-box__icon" aria-hidden="true">
          <Icon name={danger ? 'alert' : 'info'} size={22} />
        </span>
        <div>{children || <p>Esta acción no se puede deshacer.</p>}</div>
      </div>
    </Modal>
  )
}
