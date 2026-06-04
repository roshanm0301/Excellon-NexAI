
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './WorkflowAssistantDemo.scss';
import MarkdownEditor from '../markdownEditor';

interface DisplayDescriptionProps {
  ActionDefinition: any;
  onDescriptionChange?: (description: string) => void;
}

// Document/Description icon
const DescriptionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6zm2-5h8v1.5H8V15zm0-3h8v1.5H8V12zm0-3h5v1.5H8V9z" />
  </svg>
);

export const DisplayDescription: React.FC<DisplayDescriptionProps> = ({
  ActionDefinition,
  onDescriptionChange,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [togglePortalContainer, setTogglePortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setDescriptionDraft(ActionDefinition?.Description)
  }, [ActionDefinition?.Description, isPanelOpen])

  useEffect(() => {
    let currentContainer: HTMLElement | null = null;

    const tryAttach = () => {
      if (currentContainer && currentContainer.isConnected) return;

      // Portal directly into the copilot-toggle-portal — it is already correctly
      // positioned by WorkflowAssistantDemo's JS offset effect.
      const copilotPortal = document.querySelector('.copilot-toggle-portal') as HTMLElement | null;
      if (copilotPortal) {
        currentContainer = copilotPortal;
        setTogglePortalContainer(copilotPortal);
      } else {
        if (currentContainer) {
          currentContainer = null;
          setTogglePortalContainer(null);
        }
      }
    };

    tryAttach();

    const mo = new MutationObserver(() => tryAttach());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
    };
  }, []);

  useEffect(() => {
    const PANEL_WIDTH_PX = 520;
    const GAP = 12; // var(--space-3) fallback
    let ro: ResizeObserver | null = null;
    let observedEditor: HTMLElement | null = null;

    const applyOffsets = () => {
      const editor = document.querySelector('.sqd-smart-editor') as HTMLElement | null;

      // Push the editor panel right to make room for the chat panel
      if (editor) {
        const desired = isPanelOpen ? `${PANEL_WIDTH_PX}px` : '';
        if (editor.style.marginRight !== desired) {
          editor.style.marginRight = desired;
        }
      }

      const editorToggle = document.querySelector('.sqd-smart-editor-toggle') as HTMLElement | null;
      const copilotPortal = document.querySelector('.copilot-toggle-portal') as HTMLElement | null;

      // Calculate combined width of panels to the right of the toggles
      const editorVisible = editor && !editor.classList.contains('sqd-hidden');
      const editorWidth = editorVisible ? editor!.offsetWidth : 0;
      const chatWidth = isPanelOpen ? PANEL_WIDTH_PX : 0;
      const totalRight = editorWidth + chatWidth;

      if (totalRight > 0) {
        const rightPx = `${totalRight + GAP}px`;
        if (editorToggle) editorToggle.style.right = rightPx;
        if (copilotPortal) copilotPortal.style.right = rightPx;
      } else {
        // Nothing open — fall back to CSS default
        if (editorToggle) editorToggle.style.right = '';
        if (copilotPortal) copilotPortal.style.right = '';
      }

      // Observe editor resize (user can drag to widen it)
      if (editorVisible && editor !== observedEditor) {
        if (ro) ro.disconnect();
        ro = new ResizeObserver(() => applyOffsets());
        ro.observe(editor!);
        observedEditor = editor;
      } else if (!editorVisible && ro) {
        ro.disconnect();
        ro = null;
        observedEditor = null;
      }
    };

    applyOffsets();

    const mo = new MutationObserver(() => applyOffsets());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      if (ro) ro.disconnect();
      const editor = document.querySelector('.sqd-smart-editor') as HTMLElement | null;
      if (editor) editor.style.marginRight = '';
      const editorToggle = document.querySelector('.sqd-smart-editor-toggle') as HTMLElement | null;
      const copilotPortal = document.querySelector('.copilot-toggle-portal') as HTMLElement | null;
      if (editorToggle) editorToggle.style.right = '';
      if (copilotPortal) copilotPortal.style.right = '';
    };
  }, [isPanelOpen]);

  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const handleSave = useCallback(() => {
    if (onDescriptionChange) {
      onDescriptionChange(descriptionDraft);
    }
    setIsPanelOpen(false);
  }, [descriptionDraft, onDescriptionChange]);

  const handleCancel = useCallback(() => {
    setDescriptionDraft(ActionDefinition?.Description || '');
    setIsPanelOpen(false);
  }, [ActionDefinition?.Description]);


  // Description toggle button — icon only, centered
  const copilotToggleBtn = (
    <button
      className={`assistant-toggle-btn ${isPanelOpen ? 'assistant-toggle-btn--active' : ''} ${!togglePortalContainer ? 'assistant-toggle-btn--fixed' : ''}`}
      onClick={togglePanel}
      aria-label={isPanelOpen ? 'Close Description' : 'Open Description'}
      title="Description"
    >
      <DescriptionIcon className="toggle-icon" />
    </button>
  );

  return (
    <div className="workflow-assistant-demo">
      {/* Toggle — portalled next to editor toggle, or fallback to inline */}
      {togglePortalContainer
        ? createPortal(copilotToggleBtn, togglePortalContainer)
        : copilotToggleBtn
      }

      {/* Description Panel */}
      {isPanelOpen && (
        <div className="assistant-panel" role="dialog" aria-label="Description" ref={panelRef}>
          {/* Header */}
          <div className="assistant-panel__header">
            <div className="panel-title">
              <span role="status" aria-label="Online" />
              <DescriptionIcon className="panel-icon" />
              <span>Description</span>
            </div>
            <div className="panel-actions">
              <button
                className="assistant-toggle-btn"
                style={{ width: 'auto', padding: '0 8px', fontSize: 13, gap: 4, display: 'flex', alignItems: 'center' }}
                onClick={() => setIsExpanded(true)}
                title="Expand to full screen"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
              </button>
              <button
                className="assistant-toggle-btn assistant-toggle-btn--active"
                style={{ width: 'auto', padding: '0 8px', fontSize: 13, gap: 4, display: 'flex', alignItems: 'center' }}
                onClick={handleSave}
                title="Save"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z" /></svg>
              </button>
              <button
                className="assistant-toggle-btn"
                onClick={handleCancel}
                title="Close"
                aria-label="Close Panel"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
              </button>
            </div>
          </div>

          {/* Editor body */}
          <div className="assistant-messages" style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
            <MarkdownEditor
              value={descriptionDraft}
              onChange={(val) => setDescriptionDraft(val || '')}
            />
          </div>
        </div>
      )}

      {/* Full-screen expanded editor */}
      {isExpanded && createPortal(
        <div style={fullscreenOverlayStyle}>
          <div style={fullscreenHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'sans-serif', fontSize: 14, color: '#c9d1d9' }}>
              <DescriptionIcon />
              <span>Description — Full Screen</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={fullscreenBtnStyle('#f0b429', '#0d0f14')}
                onClick={() => setIsExpanded(false)}
                title="Save and close"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z" /></svg>
                <span style={{ marginLeft: 4 }}>Save</span>
              </button>
              <button
                style={fullscreenBtnStyle('#21262d', '#c9d1d9')}
                onClick={() => setIsExpanded(false)}
                title="Close full screen"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
                <span style={{ marginLeft: 4 }}>Collapse</span>
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <MarkdownEditor value={descriptionDraft} onChange={(val) => setDescriptionDraft(val || '')} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const fullscreenOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 99999,
  display: 'flex',
  flexDirection: 'column',
  background: '#0d0f14',
};

const fullscreenHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  background: '#161b22',
  borderBottom: '1px solid #21262d',
  flexShrink: 0,
};

const fullscreenBtnStyle = (bg: string, color: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  padding: '4px 10px',
  fontSize: 13,
  background: bg,
  color,
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
});

export default DisplayDescription;
