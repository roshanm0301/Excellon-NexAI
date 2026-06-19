import type { ReactNode } from 'react'
import MuiAccordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { ChevronDown } from 'lucide-react'

interface AccordionRowProps {
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  dragHandle?: boolean
}

export function AccordionRow({ title, subtitle, right, children, defaultOpen = false, dragHandle = false }: AccordionRowProps) {
  return (
    <MuiAccordion
      defaultExpanded={defaultOpen}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid var(--border-secondary)',
        borderRadius: '8px !important',
        mb: 1,
        bgcolor: 'var(--bg-primary)',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ChevronDown size={16} style={{ color: 'var(--fg-tertiary)' }} />}
        sx={{ minHeight: 44, px: 2, '& .MuiAccordionSummary-content': { m: '10px 0', alignItems: 'center', gap: 1 } }}
      >
        {dragHandle && <DragHandle />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: '0.8125rem', color: 'var(--fg-primary)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--fg-tertiary)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right && <div onClick={e => e.stopPropagation()}>{right}</div>}
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
        {children}
      </AccordionDetails>
    </MuiAccordion>
  )
}

export function DragHandle() {
  return (
    <svg width={16} height={20} viewBox="0 0 16 20" fill="var(--neutral-400)" style={{ cursor: 'grab', flexShrink: 0 }}>
      <circle cx={5} cy={6} r={1.5} /><circle cx={11} cy={6} r={1.5} />
      <circle cx={5} cy={10} r={1.5} /><circle cx={11} cy={10} r={1.5} />
      <circle cx={5} cy={14} r={1.5} /><circle cx={11} cy={14} r={1.5} />
    </svg>
  )
}
