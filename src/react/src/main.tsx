import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ToastProvider } from './design-system/components/Toast'
import { AppLayout } from './components/studio/AppLayout'
import { EntityDesignerPage } from './pages/admin/EntityDesignerPage'
import { EntityEditorPage } from './pages/studio/EntityEditorPage'
import { RuleBuilderPage } from './pages/admin/RuleBuilderPage'
import { WorkflowPage } from './pages/studio/WorkflowPage'
import { NotFoundPage } from './pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <EntityDesignerPage /> },
      { path: 'entities', element: <EntityDesignerPage /> },
      { path: 'entities/:entityType', element: <EntityEditorPage /> },
      { path: 'rules', element: <RuleBuilderPage /> },
      { path: 'workflow', element: <WorkflowPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
