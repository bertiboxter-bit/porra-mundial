import { sanitizeScoreInput } from './scoreInput.js'

/**
 * @param {{
 *   value?: string | number
 *   onChange: (value: string) => void
 *   disabled?: boolean
 *   className?: string
 *   'aria-label'?: string
 * }} props
 */
export default function ScoreInput({ value, onChange, disabled, className, 'aria-label': ariaLabel }) {
  const display = value === 0 || value === '0' ? '0' : value ? String(value) : ''

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={2}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      value={display}
      onChange={e => onChange(sanitizeScoreInput(e.target.value))}
    />
  )
}
