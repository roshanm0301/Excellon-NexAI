/**
 * AiTaskFillButton
 *
 * Sparkle icon that toggles an inline prompt bar.
 * The user types what they want, presses Enter / Send,
 * and the AI generates task settings based on their instruction.
 */

import React, { useRef, useEffect } from 'react';
import './AiTaskFillButton.scss';

export type AiTaskFillStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AiTaskFillButtonProps {
    /** Whether the prompt bar is visible */
    open: boolean;
    /** Toggle prompt bar visibility */
    onToggle: () => void;
    /** Fired when user submits their prompt */
    onSubmit: (prompt: string) => void;
    /** Current status — drives glow / check / error */
    status?: AiTaskFillStatus;
    disabled?: boolean;
    tooltip?: string;
}

/** 4-pointed sparkle — same icon as the Copilot toggle */
const SparkleIcon: React.FC = () => (
    <svg className="ai-fill-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
    </svg>
);

/** Spinner — rotating ring */
const SpinnerIcon: React.FC = () => (
    <svg className="ai-fill-icon ai-fill-icon--spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="50 20" />
    </svg>
);

/** Check mark — brief success flash */
const CheckIcon: React.FC = () => (
    <svg className="ai-fill-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
);

/** Send arrow */
const SendIcon: React.FC = () => (
    <svg className="ai-fill-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
);

export const AiTaskFillButton: React.FC<AiTaskFillButtonProps> = React.memo(({
    open,
    onToggle,
    onSubmit,
    status = 'idle',
    disabled = false,
    tooltip = 'AI Auto-Fill',
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [prompt, setPrompt] = React.useState('');
    const busy = status === 'loading';

    // Auto-focus input when opened
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    // Reset prompt on close or success
    useEffect(() => {
        if (!open || status === 'success') setPrompt('');
    }, [open, status]);

    // Click outside to close
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onToggle();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onToggle]);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!busy && !disabled) onToggle();
    };

    const handleSubmit = () => {
        const text = prompt.trim();
        if (text && !busy) onSubmit(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            onToggle();
        }
    };

    const icon = status === 'loading' ? <SpinnerIcon />
        : status === 'success' ? <CheckIcon />
            : <SparkleIcon />;

    return (
        <div className="ai-task-fill" ref={containerRef}>
            {/* ── Sparkle toggle ── */}
            <button
                type="button"
                className={`ai-task-fill-btn ai-task-fill-btn--${status}${open ? ' ai-task-fill-btn--active' : ''}${disabled ? ' ai-task-fill-btn--disabled' : ''}`}
                onClick={handleToggle}
                disabled={disabled || busy}
                title={tooltip}
                aria-label="Toggle AI prompt"
            >
                {icon}
            </button>

            {/* ── Popover prompt bar ── */}
            {open && (
                <div className="ai-task-prompt">
                    <input
                        ref={inputRef}
                        className="ai-task-prompt__input"
                        type="text"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe what to fill…"
                        disabled={busy}
                        aria-label="AI fill instruction"
                    />
                    <button
                        type="button"
                        className="ai-task-prompt__send"
                        onClick={handleSubmit}
                        disabled={busy || !prompt.trim()}
                        title="Send"
                        aria-label="Send AI fill prompt"
                    >
                        {busy ? <SpinnerIcon /> : <SendIcon />}
                    </button>
                </div>
            )}
        </div>
    );
});

AiTaskFillButton.displayName = 'AiTaskFillButton';
