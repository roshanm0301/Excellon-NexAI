import { useNavigate } from 'react-router-dom'
import { Button, EmptyState } from '../design-system'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <EmptyState
      title="Page not found"
      description="The page you are looking for does not exist."
      action={<Button variant="primary" onClick={() => navigate('/entities')}>Go to Entity Designer</Button>}
    />
  )
}

export default NotFoundPage
