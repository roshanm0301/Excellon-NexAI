import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CapabilityFlagsPanel } from '../../components/studio/EntityDesigner/CapabilityFlagsPanel'

describe('CapabilityFlagsPanel', () => {
  test('renders all store type options', () => {
    render(<CapabilityFlagsPanel value={{}} onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /Master/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Transaction/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Log/i })).toBeInTheDocument()
  })

  test('onChange fires with updated flags when store type toggle clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CapabilityFlagsPanel value={{ dbStoreType: 'master' }} onChange={onChange} />)

    await user.click(screen.getByRole('radio', { name: /Transaction/i }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dbStoreType: 'transaction' }))
  })
})
