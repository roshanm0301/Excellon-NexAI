import MuiLinearProgress from '@mui/material/LinearProgress'
import MuiStepper from '@mui/material/Stepper'
import MuiStep from '@mui/material/Step'
import MuiStepLabel from '@mui/material/StepLabel'

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
}

export function ProgressBar({ value, max = 100, color = 'var(--brand-500)' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <MuiLinearProgress
      variant="determinate"
      value={pct}
      sx={{
        height: 6,
        borderRadius: 9999,
        bgcolor: 'var(--neutral-100)',
        '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 9999 },
      }}
    />
  )
}

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <MuiStepper
      activeStep={current}
      sx={{
        '& .MuiStepLabel-label': { fontSize: '0.6875rem' },
        '& .MuiStepIcon-root.Mui-active': { color: 'var(--brand-500)' },
        '& .MuiStepIcon-root.Mui-completed': { color: 'var(--brand-500)' },
      }}
    >
      {steps.map(label => (
        <MuiStep key={label}>
          <MuiStepLabel>{label}</MuiStepLabel>
        </MuiStep>
      ))}
    </MuiStepper>
  )
}
