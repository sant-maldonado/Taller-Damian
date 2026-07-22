import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatCurrency,
  formatHours,
  getStatusLabel,
  getStatusColor,
  engineLabel,
  transLabel,
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
  it('returns Pendiente for PENDING', () => {
    expect(getStatusLabel('PENDING')).toBe('Pendiente')
  })

  it('returns En progreso for IN_PROGRESS', () => {
    expect(getStatusLabel('IN_PROGRESS')).toBe('En progreso')
  })

  it('returns Completado for COMPLETED', () => {
    expect(getStatusLabel('COMPLETED')).toBe('Completado')
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
