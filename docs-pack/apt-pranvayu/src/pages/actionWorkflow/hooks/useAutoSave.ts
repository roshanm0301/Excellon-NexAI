import { useRef } from 'react';

/**
 * Hook that provides auto-save functionality for task editors.
 * Replaces the manual save button pattern by persisting changes on every field edit.
 *
 * - `onFieldDataChanged`: Pass to DXForm — auto-saves whenever any field changes.
 * - `autoSave`: Call explicitly when updating formData outside DXForm (e.g., payload callbacks).
 *
 * Uses an `isSaving` ref guard to prevent infinite re-render loops caused by
 * setProperty → forward() → re-render → onFieldDataChanged → setProperty → ...
 */
export function useAutoSave(
    formData: any,
    stepId: string,
    stepName: string,
    setProperty: (name: string, value: any) => void,
    setId: (id: string) => void,
    setName: (name: string) => void,
) {
    const isSaving = useRef(false);

    /**
     * Handler for DXForm's onFieldDataChanged event.
     * DXForm mutates the formData object in-place before firing this event,
     * so spreading formData captures the latest values.
     */
    const onFieldDataChanged = (e: any) => {
        if (isSaving.current) return;
        isSaving.current = true;
        setProperty("taskSettings", { ...formData });
        // Sync step id/name on the canvas only when those fields actually change
        if (e.dataField === 'id' && formData.id !== stepId) setId(formData.id);
        if (e.dataField === 'name' && formData.name !== stepName) setName(formData.name);
        requestAnimationFrame(() => { isSaving.current = false; });
    };

    /**
     * Explicit save for cases where formData is replaced (not mutated in-place),
     * e.g., after a payload callback updates formData via setFormData.
     *
     * Also syncs the original formData reference in-place so that other
     * callbacks (which close over the same object) see the latest values
     * without needing a React re-render.
     */
    const autoSave = (data: any) => {
        isSaving.current = true;
        // Mutate the original formData in-place — keeps closures consistent
        // and prevents stale-data bugs when two callbacks fire before a render.
        Object.assign(formData, data);
        setProperty("taskSettings", { ...formData });
        if (formData.id !== stepId) setId(formData.id);
        if (formData.name !== stepName) setName(formData.name);
        requestAnimationFrame(() => { isSaving.current = false; });
    };

    return { onFieldDataChanged, autoSave, isSaving };
}
