import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldTypeSelector, FIELD_TYPES } from '../../components/studio/EntityDesigner/FieldTypeSelector'

describe('FieldTypeSelector', () => {
  test('renders all 14 field types', () => {
    render(<FieldTypeSelector value="string" onChange={vi.fn()} />)
    const select = screen.getByRole('combobox')
    const options = Array.from(select.querySelectorAll('option')).filter(o => o.value !== '')
    expect(options).toHaveLength(FIELD_TYPES.length)
    FIELD_TYPES.forEach(ft => {
      expect(screen.getByRole('option', { name: ft.label })).toBeInTheDocument()
    })
  })

  test('calls onChange when selection changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FieldTypeSelector value="string" onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), 'number')
    expect(onChange).toHaveBeenCalledWith('number')
  })
})
