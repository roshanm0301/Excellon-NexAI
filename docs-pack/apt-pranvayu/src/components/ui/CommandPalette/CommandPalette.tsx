// ============================================================================
// COMMAND PALETTE (Ctrl/Cmd + K)
// Quick navigation and action search
// ============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../store/customHooks';
import './CommandPalette.scss';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: 'navigation' | 'action' | 'settings';
  action: () => void;
  keywords?: string[];
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const navigationList = useAppSelector((state) => state.role.navigationList);

  // Build command list from navigation + static commands
  const commands: CommandItem[] = useMemo(() => {
    const navCommands: CommandItem[] = (navigationList || []).map((nav: any) => ({
      id: `nav-${nav.path}`,
      label: nav.text || nav.SystemName || nav.path,
      description: `Navigate to ${nav.text || nav.path}`,
      icon: '→',
      category: 'navigation' as const,
      action: () => navigate(nav.path),
      keywords: [nav.text, nav.path, nav.SystemName].filter(Boolean),
    }));

    const staticCommands: CommandItem[] = [
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        description: 'Go to dashboard',
        icon: '📊',
        category: 'navigation',
        action: () => navigate('/dashboard'),
        keywords: ['home', 'main', 'overview'],
      },
      {
        id: 'nav-profile',
        label: 'Profile',
        description: 'View your profile',
        icon: '👤',
        category: 'navigation',
        action: () => navigate('/profile'),
        keywords: ['account', 'user', 'me'],
      },
      {
        id: 'action-reload',
        label: 'Reload Page',
        description: 'Refresh the current page',
        icon: '🔄',
        category: 'action',
        action: () => globalThis.location.reload(),
        keywords: ['refresh', 'reload'],
      },
    ];

    // Deduplicate by path
    const seen = new Set<string>();
    const all = [...navCommands, ...staticCommands];
    return all.filter(cmd => {
      if (seen.has(cmd.id)) return false;
      seen.add(cmd.id);
      return true;
    });
  }, [navigationList, navigate]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd => {
      const searchStr = [cmd.label, cmd.description, ...(cmd.keywords || [])].join(' ').toLowerCase();
      return searchStr.includes(q);
    });
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const flatResults = useMemo(() => filteredCommands, [filteredCommands]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector('.saas-cmd-item--active');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        flatResults[selectedIndex].action();
        setIsOpen(false);
      }
    }
  }, [flatResults, selectedIndex]);

  const handleSelect = useCallback((cmd: CommandItem) => {
    cmd.action();
    setIsOpen(false);
  }, []);

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    navigation: 'Pages',
    action: 'Actions',
    settings: 'Settings',
  };

  let itemIndex = -1;

  return (
    <div className="saas-cmd-overlay" onClick={() => setIsOpen(false)} onKeyDown={e => e.key === 'Escape' && setIsOpen(false)} role="presentation">
      <div className="saas-cmd-palette" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <div className="saas-cmd-input-wrapper">
          <svg className="saas-cmd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="saas-cmd-input"
            placeholder="Search pages, actions, settings..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="saas-cmd-kbd">ESC</kbd>
        </div>

        <div className="saas-cmd-results" ref={listRef}>
          {flatResults.length === 0 && (
            <div className="saas-cmd-empty">
              <span>No results found for "{query}"</span>
            </div>
          )}
          {Object.entries(groupedCommands).map(([category, items]) => (
            <div key={category} className="saas-cmd-group">
              <div className="saas-cmd-group-label">{categoryLabels[category] || category}</div>
              {items.map(cmd => {
                itemIndex++;
                const idx = itemIndex;
                return (
                  <button
                    key={cmd.id}
                    className={`saas-cmd-item ${idx === selectedIndex ? 'saas-cmd-item--active' : ''}`}
                    onClick={() => handleSelect(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    type="button"
                  >
                    <span className="saas-cmd-item__icon">{cmd.icon}</span>
                    <div className="saas-cmd-item__content">
                      <span className="saas-cmd-item__label">{cmd.label}</span>
                      {cmd.description && (
                        <span className="saas-cmd-item__desc">{cmd.description}</span>
                      )}
                    </div>
                    <kbd className="saas-cmd-item__shortcut">↵</kbd>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="saas-cmd-footer">
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Select</span>
          <span><kbd>ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
