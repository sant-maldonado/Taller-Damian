import { describe, it, expect, vi } from 'vitest'
import { render, screen } from './test-utils'
import { fireEvent } from '@testing-library/react'
import { Input, Select, Textarea, Modal, EmptyState, StatusBadge } from '../components/ui'
import Loading from '../components/Loading'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Nombre" />)
    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders without label', () => {
    const { container } = render(<Input />)
    expect(container.querySelector('label')).toBeNull()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('passes props to input element', () => {
    render(<Input placeholder="Escribí acá" type="email" data-testid="email-input" />)
    const input = screen.getByTestId('email-input')
    expect(input).toHaveAttribute('placeholder', 'Escribí acá')
    expect(input).toHaveAttribute('type', 'email')
  })
})

describe('Select', () => {
  it('renders with label', () => {
    render(
      <Select label="Estado">
        <option value="P">Pendiente</option>
      </Select>
    )
    expect(screen.getByText('Estado')).toBeInTheDocument()
  })

  it('renders children options', () => {
    render(
      <Select label="Tipo">
        <option value="A">Opción A</option>
        <option value="B">Opción B</option>
      </Select>
    )
    expect(screen.getByText('Opción A')).toBeInTheDocument()
    expect(screen.getByText('Opción B')).toBeInTheDocument()
  })
})

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Descripción" />)
    expect(screen.getByText('Descripción')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})

describe('Modal', () => {
  it('renders when open=true', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        <p>Contenido</p>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('does not render when open=false', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Test Modal">
        <p>Contenido</p>
      </Modal>
    )
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('calls onClose when clicking overlay', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal open={true} onClose={onClose} title="Test Modal">
        <p>Contenido</p>
      </Modal>
    )
    fireEvent.click(container.querySelector('.absolute.inset-0'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={<span>icon</span>} title="Sin resultados" description="No hay nada para mostrar" />)
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
    expect(screen.getByText('No hay nada para mostrar')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('renders Pendiente for PENDING', () => {
    render(<StatusBadge status="PENDING" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('renders En progreso for IN_PROGRESS', () => {
    render(<StatusBadge status="IN_PROGRESS" />)
    expect(screen.getByText('En progreso')).toBeInTheDocument()
  })

  it('renders Completado for COMPLETED', () => {
    render(<StatusBadge status="COMPLETED" />)
    expect(screen.getByText('Completado')).toBeInTheDocument()
  })

  it('renders Cancelado for CANCELLED', () => {
    render(<StatusBadge status="CANCELLED" />)
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
  })
})

describe('Loading', () => {
  it('renders loading text', () => {
    render(<Loading />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })
})
