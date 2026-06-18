import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Spinner } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'
import { ComponentPalette } from './ComponentPalette'
import { ComponentTree } from './ComponentTree'
import { EntityFieldPicker } from './EntityFieldPicker'

type LeftTab = 'outline' | 'library' | 'fields'

export function LeftRail() {
  const [activeTab, setActiveTab] = useState<LeftTab>('library')
  const togglePalette = useCanvasStore(s => s.togglePalette)
  const payload = useCanvasStore(s => s.payload)

  return (
    <div className="lr-panel">
      <div className="lr-header">
        <div className="lr-tabs">
          <button
            className={`lr-tab${activeTab === 'outline' ? ' lr-tab--active' : ''}`}
            onClick={() => setActiveTab('outline')}
            data-testid="lr-tab-outline"
            title="Component tree outline"
          >
            Outline
          </button>
          <button
            className={`lr-tab${activeTab === 'library' ? ' lr-tab--active' : ''}`}
            onClick={() => setActiveTab('library')}
            data-testid="lr-tab-library"
            title="Component library"
          >
            Library
          </button>
          <button
            className={`lr-tab${activeTab === 'fields' ? ' lr-tab--active' : ''}`}
            onClick={() => setActiveTab('fields')}
            data-testid="lr-tab-fields"
            title="Entity fields"
          >
            Fields
          </button>
        </div>
        <button
          className="lr-collapse"
          onClick={togglePalette}
          title="Collapse panel"
          aria-label="Collapse left panel"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <div className="lr-content">
        {activeTab === 'library' && <ComponentPalette />}

        {activeTab === 'outline' && (
          payload?.component_tree
            ? <div className="lr-outline-wrap"><ComponentTree tree={payload.component_tree} /></div>
            : <div className="lr-placeholder"><Spinner size={18} /></div>
        )}

        {activeTab === 'fields' && <EntityFieldPicker />}
      </div>
    </div>
  )
}
