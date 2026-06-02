import './index.css'
import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom'
import { ToastProvider } from './design-system/components/Toast'
import { Spinner } from './design-system'
import AppLayout from './components/studio/AppLayout'

const EntityDesignerPage = lazy(() => import('./pages/admin/EntityDesignerPage'))
const EntityEditorPage = lazy(() => import('./pages/studio/EntityEditorPage'))
const EntityMapPage = lazy(() => import('./pages/studio/EntityMapPage'))
const RuleBuilderPage = lazy(() => import('./pages/admin/RuleBuilderPage'))
const RuleEditorPage = lazy(() => import('./pages/studio/RuleEditorPage'))
const WorkflowPage = lazy(() => import('./pages/studio/WorkflowPage'))
const OverlayStudioPage = lazy(() => import('./pages/admin/OverlayStudioPage'))
const NodeTreePage = lazy(() => import('./pages/admin/NodeTreePage'))
const ExpressionStudioPage = lazy(() => import('./pages/studio/ExpressionStudioPage'))
const ViewDesignerListPage = lazy(() => import('./pages/admin/ViewDesignerListPage'))
const ViewDesignerPage = lazy(() => import('./pages/studio/view-designer/ViewDesignerPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const DemoSetupPage = lazy(() => import('./pages/admin/DemoSetupPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function wrap(element: React.ReactNode) {
  return <Suspense fallback={<Spinner />}>{element}</Suspense>
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/admin/entities" replace /> },
        { path: 'admin/entities', element: wrap(<EntityDesignerPage />) },
        { path: 'admin/entities/new', element: wrap(<EntityEditorPage />) },
        { path: 'admin/entities/:id/edit', element: wrap(<EntityEditorPage />) },
        { path: 'admin/entities/map', element: wrap(<EntityMapPage />) },
        { path: 'admin/rules', element: wrap(<RuleBuilderPage />) },
        { path: 'admin/rules/new', element: wrap(<RuleEditorPage />) },
        { path: 'admin/rules/:id/edit', element: wrap(<RuleEditorPage />) },
        { path: 'admin/overlays', element: wrap(<OverlayStudioPage />) },
        { path: 'admin/nodes', element: wrap(<NodeTreePage />) },
        { path: 'admin/expressions', element: wrap(<ExpressionStudioPage />) },
        { path: 'studio/views', element: wrap(<ViewDesignerListPage />) },
        { path: 'studio/views/:viewId/edit', element: wrap(<ViewDesignerPage />) },
        { path: 'admin/setup', element: wrap(<DemoSetupPage />) },
        { path: 'workflow', element: wrap(<WorkflowPage />) },
        { path: '*', element: wrap(<NotFoundPage />) },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  )
}

// MSW must never block the app from rendering. Start it async and render
// immediately regardless of whether the service worker registration succeeds.
if (import.meta.env.VITE_MSW === 'true') {
  import('./mocks')
    .then(({ setupMocks }) => setupMocks())
    .catch(err => console.warn('[MSW] Failed to start, continuing without mocks:', err))
    .finally(() => renderApp())
} else {
  renderApp()
}
