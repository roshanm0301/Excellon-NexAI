/**
 * useAutoSave — Debounced auto-save hook for the View Designer
 *
 * Watches the canvas store for dirty state and triggers a save after
 * a configurable debounce period. Shows status feedback via toast.
 *
 * M5.2: passes the current revision to the backend for optimistic concurrency
 * detection. If the backend returns 409 REVISION_CONFLICT, sets
 * `conflictDetected: true` rather than raising a generic error.
 */

import { useEffect, useRef, useState } from 'react'
import { useCanvasStore } from './useCanvasStore'
import { useSaveDraft } from '../../../hooks/useViewStudio'
import { ApiError } from '../../../config/studioApi'

const DEFAULT_DEBOUNCE_MS = 3000

interface AutoSaveOptions {
  enabled?: boolean
  debounceMs?: number
  onSaved?: () => void
  onError?: (err: Error) => void
}

export function useAutoSave(viewId: string | undefined, options: AutoSaveOptions = {}) {
  const { enabled = true, debounceMs = DEFAULT_DEBOUNCE_MS, onSaved, onError } = options
  const saveMut = useSaveDraft(viewId ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  const [conflictDetected, setConflictDetected] = useState(false)

  const isDirty = useCanvasStore(s => s.isDirty)
  const payload = useCanvasStore(s => s.payload)
  const revision = useCanvasStore(s => s.revision)
  const setRevision = useCanvasStore(s => s.setRevision)

  useEffect(() => {
    if (!enabled || !viewId || !isDirty || !payload) return

    // Fingerprint to avoid duplicate saves
    const fingerprint = JSON.stringify(payload)
    if (fingerprint === lastSavedRef.current) return

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      // Double-check still dirty
      const currentState = useCanvasStore.getState()
      if (!currentState.isDirty || !currentState.payload) return

      const currentFingerprint = JSON.stringify(currentState.payload)
      if (currentFingerprint === lastSavedRef.current) return

      saveMut.mutate(
        { payload: currentState.payload, revision: currentState.revision > 0 ? currentState.revision : undefined },
        {
          onSuccess: (ver) => {
            lastSavedRef.current = currentFingerprint
            setConflictDetected(false)
            // Keep revision in sync with what the server returned
            if (ver && typeof ver.revision === 'number') {
              setRevision(ver.revision)
            }
            onSaved?.()
          },
          onError: (err) => {
            if (err instanceof ApiError && err.status === 409) {
              setConflictDetected(true)
              return
            }
            onError?.(err instanceof Error ? err : new Error(String(err)))
          },
        },
      )
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [enabled, viewId, isDirty, payload, revision, debounceMs, saveMut, onSaved, onError, setRevision])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return {
    isSaving: saveMut.isPending,
    lastError: saveMut.error,
    conflictDetected,
    clearConflict: () => setConflictDetected(false),
  }
}
