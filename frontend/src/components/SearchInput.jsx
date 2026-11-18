import { Icon } from './Icon'

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  label = 'Buscar',
  id,
}) {
  return (
    <div className="search-input">
      <Icon name="search" size={18} className="search-input__icon" />
      <input
        id={id}
        type="search"
        className="search-input__field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          className="search-input__clear"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
        >
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </div>
  )
}
