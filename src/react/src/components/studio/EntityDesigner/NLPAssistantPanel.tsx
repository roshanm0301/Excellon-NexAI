import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Download } from 'lucide-react'
import { Drawer, Button, Textarea, IconButton } from '../../../design-system'
import {
  nlpChat,
  nlpImport,
  type NLPChatMessage,
  type NLPImportedField,
} from '../../../config/studioApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatEntry {
  role: 'user' | 'assistant'
  content: string
}

interface NLPAssistantPanelProps {
  open: boolean
  onClose: () => void
  schemaContext: Record<string, unknown>
  onImportFields?: (fields: NLPImportedField[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NLPAssistantPanel({
  open,
  onClose,
  schemaContext,
  onImportFields,
}: NLPAssistantPanelProps) {
  // Chat state
  const [conversation, setConversation] = useState<ChatEntry[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Import state
  const [importText, setImportText] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importedFields, setImportedFields] = useState<NLPImportedField[]>([])
  const [importError, setImportError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // ── Chat send ──────────────────────────────────────────────────────────────

  async function handleSendChat() {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return

    const userEntry: ChatEntry = { role: 'user', content: msg }
    setConversation(prev => [...prev, userEntry])
    setChatInput('')
    setChatLoading(true)

    try {
      const history: NLPChatMessage[] = [...conversation, userEntry].map(e => ({
        role: e.role,
        content: e.content,
      }))

      const res = await nlpChat(msg, { ...schemaContext, history })
      setConversation(prev => [...prev, { role: 'assistant', content: res.message }])
    } catch {
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not process that request. Please try again.' },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  function handleChatKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendChat()
    }
  }

  // ── AI Import ─────────────────────────────────────────────────────────────

  async function handleImport() {
    const text = importText.trim()
    if (!text || importLoading) return

    setImportLoading(true)
    setImportError(null)
    setImportedFields([])

    try {
      const res = await nlpImport(text)
      setImportedFields(res.fields)
    } catch {
      setImportError('Could not generate fields. Check your description and try again.')
    } finally {
      setImportLoading(false)
    }
  }

  function handleApplyFields() {
    if (onImportFields && importedFields.length > 0) {
      onImportFields(importedFields)
      setImportedFields([])
      setImportText('')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="AI Assistant"
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>

        {/* ── Chat section ── */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid var(--border-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={14} color="var(--brand-500)" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
              Chat
            </span>
          </div>

          {/* Message history */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minHeight: 200,
              maxHeight: 300,
            }}
          >
            {conversation.length === 0 ? (
              <div style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', paddingTop: 24 }}>
                Ask me anything about this entity schema — I can suggest fields, rules, relationships, and more.
              </div>
            ) : (
              conversation.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: entry.role === 'user' ? 'row-reverse' : 'row',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '8px 12px',
                      borderRadius: entry.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: entry.role === 'user' ? 'var(--brand-600)' : 'var(--bg-tertiary)',
                      color: entry.role === 'user' ? 'white' : 'var(--fg-primary)',
                      fontSize: 'var(--text-sm)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {entry.content}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '12px 12px 12px 2px',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--fg-tertiary)',
                    fontSize: 'var(--text-sm)',
                    fontStyle: 'italic',
                  }}
                >
                  Thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-secondary)', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ask about this entity… (Enter to send)"
                rows={2}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <IconButton
                onClick={handleSendChat}
                disabled={!chatInput.trim() || chatLoading}
                aria-label="Send message"
              >
                <Send size={16} />
              </IconButton>
            </div>
          </div>
        </section>

        {/* ── AI Import section ── */}
        <section
          style={{
            borderTop: '2px solid var(--border-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <div
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid var(--border-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Download size={14} color="var(--brand-500)" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
              AI Field Import
            </span>
          </div>

          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>
              Paste a plain-text description of your entity and we will generate field definitions automatically.
            </p>

            <Textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={'e.g. "A customer has a full name, email address, phone number, date of birth, and a tier (gold, silver, bronze)."'}
              rows={4}
            />

            {importError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--error-50, #fef2f2)',
                  border: '1px solid var(--error-200, #fecaca)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--error-700, #b91c1c)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {importError}
              </div>
            )}

            {importedFields.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--fg-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {importedFields.length} field{importedFields.length !== 1 ? 's' : ''} generated
                </div>
                {importedFields.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      borderBottom: i < importedFields.length - 1 ? '1px solid var(--border-secondary)' : undefined,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-primary)', flex: 1 }}>
                      {f.name}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--brand-50)',
                        color: 'var(--brand-700)',
                        fontWeight: 500,
                      }}
                    >
                      {f.type}
                    </span>
                    {f.required && (
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--error-50)',
                          color: 'var(--error-700)',
                          fontWeight: 500,
                        }}
                      >
                        required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {importedFields.length > 0 && onImportFields && (
                <Button variant="primary" onClick={handleApplyFields}>
                  Add {importedFields.length} field{importedFields.length !== 1 ? 's' : ''} to schema
                </Button>
              )}
              <Button
                variant="secondary"
                disabled={!importText.trim() || importLoading}
                onClick={handleImport}
              >
                {importLoading ? 'Generating…' : 'Generate fields'}
              </Button>
            </div>
          </div>
        </section>

      </div>
    </Drawer>
  )
}

export default NLPAssistantPanel
