# ADR-001: Adopt Zustand for View Designer Canvas State

**Status:** Accepted  
**Date:** 2026-06-02  
**Context:** UI Studio View Designer  

## Decision

Use **Zustand v5** for the View Designer canvas state management.

## Context

The View Designer requires a complex, mutable state model:
- Component tree with deep nesting
- Selection/hover tracking
- Undo/redo stack (up to 50 entries)
- Dirty state tracking
- Insert targets for drag-and-drop

React's `useState` is insufficient for cross-component access to this state (Palette, Tree, PropertyPanel all need it). The CLAUDE.md rule ("no global store for the Entity Designer") explicitly scopes the restriction to the Entity Designer. The View Designer is a distinct subsystem with different requirements.

## Why Zustand

- Zero boilerplate (vs Redux)
- No provider wrapper needed
- Works with React 19 concurrent features
- Tiny bundle (~1KB)
- Supports subscriptions with selectors (prevents unnecessary re-renders)
- Does **not** require context providers polluting the component tree

## Scope

Zustand is used **only** for the View Designer canvas. No other part of the application uses Zustand. All server state remains in TanStack Query.

## Alternatives Considered

- **useState + context:** Too many re-renders with deep tree updates
- **useReducer + context:** Same re-render problem, more boilerplate
- **Jotai:** Similar to Zustand but atom-based model is less natural for a tree structure
- **Redux Toolkit:** Overkill for a single-feature store
