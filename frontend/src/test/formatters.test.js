import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatCurrency,
  formatHours,
  getStatusLabel,
  getStatusColor,
  engineLabel,
  transLabel,
  waLink,
  ENGINE_LABELS,
  TRANSMISSION_LABELS,
} from '../utils/formatters'

describe('formatDate', () => {
  it('formats a valid date string', () => {
    expect(formatDate('2026-03-15T12:00:00')).toBe('15/03/2026')
  })

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatDate('')).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })
})

describe('formatCurrency', () => {
  it('formats a positive amount', () => {
    const result = formatCurrency(1500)
    expect(result).toContain('1.500')
    expect(result).toContain('$')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toContain('$')
  })

  it('returns $0 for null', () => {
    expect(formatCurrency(null)).toBe('$0')
  })

  it('returns $0 for undefined', () => {
    expect(formatCurrency(undefined)).toBe('$0')
  })

  it('formats decimal amounts', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('1.234')
    expect(result).toContain('$')
  })
})

describe('formatHours', () => {
  it('formats whole hours', () => {
    expect(formatHours(3)).toBe('3h')
  })

  it('formats decimal hours to hours and minutes', () => {
    expect(formatHours(2.5)).toBe('2h 30m')
  })

  it('formats 1.25 as 1h 15m', () => {
    expect(formatHours(1.25)).toBe('1h 15m')
  })

  it('formats 0 as 0h', () => {
    expect(formatHours(0)).toBe('0h')
  })

  it('returns 0h for null', () => {
    expect(formatHours(null)).toBe('0h')
  })

  it('returns 0h for undefined', () => {
    expect(formatHours(undefined)).toBe('0h')
  })

  it('rounds minutes correctly', () => {
    expect(formatHours(1.1)).toBe('1h 6m')
  })
})

describe('getStatusLabel', () => {
  it('returns Recibido for PENDING', () => {
    expect(getStatusLabel('PENDING')).toBe('Recibido')
  })

  it('returns En taller for IN_PROGRESS', () => {
    expect(getStatusLabel('IN_PROGRESS')).toBe('En taller')
  })

  it('returns Listo for COMPLETED', () => {
    expect(getStatusLabel('COMPLETED')).toBe('Listo')
  })

  it('returns Cancelado for CANCELLED', () => {
    expect(getStatusLabel('CANCELLED')).toBe('Cancelado')
  })

  it('returns the raw value for an unknown status', () => {
    expect(getStatusLabel('UNKNOWN')).toBe('UNKNOWN')
  })
})

describe('getStatusColor', () => {
  it('returns bg-yellow-500 for PENDING', () => {
    expect(getStatusColor('PENDING')).toBe('bg-yellow-500')
  })

  it('returns bg-blue-500 for IN_PROGRESS', () => {
    expect(getStatusColor('IN_PROGRESS')).toBe('bg-blue-500')
  })

  it('returns bg-green-500 for COMPLETED', () => {
    expect(getStatusColor('COMPLETED')).toBe('bg-green-500')
  })

  it('returns bg-red-500 for CANCELLED', () => {
    expect(getStatusColor('CANCELLED')).toBe('bg-red-500')
  })

  it('returns bg-gray-500 for an unknown status', () => {
    expect(getStatusColor('UNKNOWN')).toBe('bg-gray-500')
  })
})

describe('engineLabel', () => {
  it('returns Naftero for naftero', () => {
    expect(engineLabel('naftero')).toBe('Naftero')
  })

  it('returns Diésel for diesel', () => {
    expect(engineLabel('diesel')).toBe('Diésel')
  })

  it('returns Naftero/Gasoleta for naftero_gasoleta', () => {
    expect(engineLabel('naftero_gasoleta')).toBe('Naftero/Gasoleta')
  })

  it('returns the raw type for an unknown engine', () => {
    expect(engineLabel('electric')).toBe('electric')
  })

  it('returns em dash for null', () => {
    expect(engineLabel(null)).toBe('—')
  })

  it('returns em dash for undefined', () => {
    expect(engineLabel(undefined)).toBe('—')
  })
})

describe('transLabel', () => {
  it('returns Manual for manual', () => {
    expect(transLabel('manual')).toBe('Manual')
  })

  it('returns Automática for automatica', () => {
    expect(transLabel('automatica')).toBe('Automática')
  })

  it('returns the raw type for an unknown transmission', () => {
    expect(transLabel('cvt')).toBe('cvt')
  })

  it('returns em dash for null', () => {
    expect(transLabel(null)).toBe('—')
  })

  it('returns em dash for undefined', () => {
    expect(transLabel(undefined)).toBe('—')
  })
})

describe('waLink', () => {
  it('normalizes an AR mobile to 549', () => {
    expect(waLink('11 4123-4567', 'hola')).toBe('https://wa.me/5491141234567?text=hola')
  })

  it('keeps a full 549 number', () => {
    expect(waLink('+54 9 11 4123 4567', 'hola')).toBe('https://wa.me/5491141234567?text=hola')
  })

  it('inserts the 9 after 54', () => {
    expect(waLink('541123456789', 'hola')).toBe('https://wa.me/5491123456789?text=hola')
  })

  it('prepends 54 to an already-9-number', () => {
    expect(waLink('91142345678', 'hola')).toBe('https://wa.me/5491142345678?text=hola')
  })

  it('encodes the text', () => {
    expect(waLink('1141234567', 'a b&c')).toBe('https://wa.me/5491141234567?text=a%20b%26c')
  })

  it('returns null for empty phone', () => {
    expect(waLink('', 'hola')).toBeNull()
  })
})

describe('ENGINE_LABELS', () => {
  it('has correct mappings', () => {
    expect(ENGINE_LABELS).toEqual({
      naftero: 'Naftero',
      diesel: 'Diésel',
      naftero_gasoleta: 'Naftero/Gasoleta',
    })
  })
})

describe('TRANSMISSION_LABELS', () => {
  it('has correct mappings', () => {
    expect(TRANSMISSION_LABELS).toEqual({
      manual: 'Manual',
      automatica: 'Automática',
    })
  })
})
