/**
 * PluginManagerPanel — Plugin marketplace and management
 *
 * Provides:
 * - List installed plugins
 * - Install new plugins (register)
 * - Remove plugins
 * - View plugin-contributed components
 */

import { useState, useCallback } from 'react'
import { Puzzle, Plus, Trash2, ExternalLink, Check, Package } from 'lucide-react'
import { Button, Spinner, useToast } from '../../../design-system'
import { usePlugins, useRegisterPlugin, useRemovePlugin, useComponentRegistry } from '../../../hooks/useViewStudio'
import type { RegisterPluginRequest, Plugin } from '../../../types/viewStudio'

// ─── Component ───────────────────────────────────────────────────────────────

export function PluginManagerPanel() {
  const { data: plugins, isLoading } = usePlugins()
  const { data: registry } = useComponentRegistry()
  const registerMut = useRegisterPlugin()
  const removeMut = useRemovePlugin()
  const { success, error } = useToast()
  const [showInstall, setShowInstall] = useState(false)

  const handleRemove = useCallback((pluginId: string) => {
    if (!confirm('Remove this plugin? Its components will no longer be available.')) return
    removeMut.mutate(pluginId, {
      onSuccess: () => success('Removed', 'Plugin removed successfully'),
      onError: () => error('Failed', 'Could not remove plugin'),
    })
  }, [removeMut, success, error])

  const pluginComponents = (pluginId: string) => {
    return (registry ?? []).filter(c => c.plugin_id === pluginId)
  }

  if (isLoading) {
    return (
      <div className="plugin-panel">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="plugin-panel">
      <div className="plugin-panel__header">
        <div className="pp-section__title">
          <Puzzle size={14} style={{ marginRight: 4 }} />
          Plugins ({(plugins ?? []).length})
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowInstall(true)}>
          <Plus size={12} /> Install
        </Button>
      </div>

      {/* Plugin list */}
      {(plugins ?? []).length === 0 && (
        <p className="pp-empty-msg">No plugins installed. Install one to extend the component library.</p>
      )}

      {(plugins ?? []).map(plugin => (
        <PluginCard
          key={plugin.plugin_id}
          plugin={plugin}
          componentCount={pluginComponents(plugin.plugin_id).length}
          onRemove={() => handleRemove(plugin.plugin_id)}
          isRemoving={removeMut.isPending}
        />
      ))}

      {/* Install modal */}
      {showInstall && (
        <InstallPluginForm
          onClose={() => setShowInstall(false)}
          onInstall={(req) => {
            registerMut.mutate(req, {
              onSuccess: () => { success('Installed', 'Plugin registered'); setShowInstall(false) },
              onError: () => error('Failed', 'Could not register plugin'),
            })
          }}
          isPending={registerMut.isPending}
        />
      )}
    </div>
  )
}

// ─── Plugin Card ─────────────────────────────────────────────────────────────

function PluginCard({
  plugin,
  componentCount,
  onRemove,
  isRemoving,
}: {
  plugin: Plugin
  componentCount: number
  onRemove: () => void
  isRemoving: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="plugin-card">
      <div className="plugin-card__header" onClick={() => setExpanded(!expanded)}>
        <div className="plugin-card__info">
          <Package size={16} className="plugin-card__icon" />
          <div>
            <div className="plugin-card__name">{plugin.plugin_name}</div>
            <div className="plugin-card__meta">
              v{plugin.version}
              {plugin.author && ` · ${plugin.author}`}
              {' · '}
              {componentCount} component{componentCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="plugin-card__actions">
          {plugin.is_active && (
            <span className="plugin-card__active"><Check size={10} /> Active</span>
          )}
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRemove() }} disabled={isRemoving}>
            <Trash2 size={12} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="plugin-card__body">
          <div className="plugin-card__field">
            <span className="plugin-card__label">Plugin ID:</span>
            <span className="plugin-card__value">{plugin.plugin_id}</span>
          </div>
          {plugin.runtime_bundle_url && (
            <div className="plugin-card__field">
              <span className="plugin-card__label">Runtime Bundle:</span>
              <span className="plugin-card__value">
                {plugin.runtime_bundle_url}
                <ExternalLink size={10} style={{ marginLeft: 4 }} />
              </span>
            </div>
          )}
          {plugin.designer_bundle_url && (
            <div className="plugin-card__field">
              <span className="plugin-card__label">Designer Bundle:</span>
              <span className="plugin-card__value">{plugin.designer_bundle_url}</span>
            </div>
          )}
          <div className="plugin-card__field">
            <span className="plugin-card__label">Installed:</span>
            <span className="plugin-card__value">{formatDate(plugin.installed_at)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Install Form ────────────────────────────────────────────────────────────

function InstallPluginForm({
  onClose,
  onInstall,
  isPending,
}: {
  onClose: () => void
  onInstall: (req: RegisterPluginRequest) => void
  isPending: boolean
}) {
  const [form, setForm] = useState<RegisterPluginRequest>({
    plugin_name: '',
    version: '1.0.0',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.plugin_name.trim()) return
    onInstall(form)
  }

  return (
    <div className="plugin-install">
      <div className="plugin-install__header">
        <span>Install Plugin</span>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
      </div>
      <form className="plugin-install__form" onSubmit={handleSubmit}>
        <div className="pp-field">
          <label className="pp-field__label">Plugin Name *</label>
          <input
            type="text"
            className="pp-field__input"
            value={form.plugin_name}
            onChange={e => setForm({ ...form, plugin_name: e.target.value })}
            placeholder="my-custom-components"
            required
          />
        </div>
        <div className="pp-field">
          <label className="pp-field__label">Version *</label>
          <input
            type="text"
            className="pp-field__input"
            value={form.version}
            onChange={e => setForm({ ...form, version: e.target.value })}
            placeholder="1.0.0"
            required
          />
        </div>
        <div className="pp-field">
          <label className="pp-field__label">Author</label>
          <input
            type="text"
            className="pp-field__input"
            value={form.author ?? ''}
            onChange={e => setForm({ ...form, author: e.target.value || undefined })}
            placeholder="Author name"
          />
        </div>
        <div className="pp-field">
          <label className="pp-field__label">Runtime Bundle URL</label>
          <input
            type="url"
            className="pp-field__input"
            value={form.runtime_bundle_url ?? ''}
            onChange={e => setForm({ ...form, runtime_bundle_url: e.target.value || undefined })}
            placeholder="https://cdn.example.com/plugin/runtime.js"
          />
        </div>
        <div className="pp-field">
          <label className="pp-field__label">Designer Bundle URL</label>
          <input
            type="url"
            className="pp-field__input"
            value={form.designer_bundle_url ?? ''}
            onChange={e => setForm({ ...form, designer_bundle_url: e.target.value || undefined })}
            placeholder="https://cdn.example.com/plugin/designer.js"
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending || !form.plugin_name.trim()}>
          {isPending ? 'Installing...' : 'Install Plugin'}
        </Button>
      </form>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}
