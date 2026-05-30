import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RetentionPanel } from '../../components/studio/EntityDesigner/RetentionPanel'

describe('RetentionPanel', () => {
  test('renders SIMPLE pipeline stages', () => {
    render(<RetentionPanel value={{ pipelineMode: 'SIMPLE' }} onChange={vi.fn()} />)
    expect(screen.getByText('Recycle Bin')).toBeInTheDocument()
    expect(screen.getByText('Pending Purge')).toBeInTheDocument()
    expect(screen.getByText('Hard Delete')).toBeInTheDocument()
  })

  test('renders GDPR pipeline with 5 stages when mode=GDPR', () => {
    render(<RetentionPanel value={{ pipelineMode: 'GDPR' }} onChange={vi.fn()} />)
    expect(screen.getByText('Recycle Bin')).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
    expect(screen.getByText('Anonymised')).toBeInTheDocument()
    expect(screen.getByText('Pending Purge')).toBeInTheDocument()
    expect(screen.getByText('Hard Delete')).toBeInTheDocument()
  })

  test('calls onChange when mode changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<RetentionPanel value={{ pipelineMode: 'SIMPLE' }} onChange={onChange} />)

    await user.click(screen.getByRole('radio', { name: 'GDPR' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ pipelineMode: 'GDPR' }))
  })
})
