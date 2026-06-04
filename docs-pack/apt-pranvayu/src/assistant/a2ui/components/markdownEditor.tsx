import React, { useRef } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const newText = value.slice(0, start) + '  ' + value.slice(ta.selectionEnd);
      onChange(newText);
      requestAnimationFrame(() => ta.setSelectionRange(start + 2, start + 2));
    }
  };

  return (
    <div style={styles.root}>
      <style>{cssString}</style>

      <div style={styles.workspace}>
        <div style={styles.editorPane}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.textarea}
            spellCheck={false}
            placeholder="Start writing description..."
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    // background: '#0d0f14',
    // color: '#c9d1d9',
    overflow: 'hidden',
  },
  workspace: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  editorPane: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    minWidth: 0,
    position: 'relative',
  },
  textarea: {
    flex: 1,
    // background: '#0d0f14',
    // color: '#c9d1d9',
    border: 'none',
    outline: 'none',
    padding: '24px',
    fontSize: '14px',
    lineHeight: '1.8',
    fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
    resize: 'none',
    overflowY: 'auto',
    caretColor: '#f0b429',
  },
  divider: {
    width: '1px',
    background: '#21262d',
    flexShrink: 0,
  },
  preview: {
    flex: 1,
    padding: '24px 32px',
    overflowY: 'auto',
    fontFamily: "'Georgia', 'Cambria', serif",
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#c9d1d9',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '0 16px',
    height: '28px',
    background: '#161b22',
    borderTop: '1px solid #21262d',
    flexShrink: 0,
  },
  stat: {
    fontSize: '11px',
    color: '#484f58',
    letterSpacing: '0.3px',
  },
  statDot: {
    fontSize: '11px',
    color: '#30363d',
  },
};

const cssString = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .preview-toggle-btn:hover { background: #21262d !important; color: #f0b429 !important; border-color: #f0b429 !important; transform: scale(1.08); }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #484f58; }

  .markdown-preview h1 { font-family: 'Georgia', serif; font-size: 2em; font-weight: 700; color: #e6edf3; margin: 0.8em 0 0.4em; line-height: 1.2; border-bottom: 1px solid #21262d; padding-bottom: 0.3em; }
  .markdown-preview h2 { font-family: 'Georgia', serif; font-size: 1.5em; font-weight: 700; color: #e6edf3; margin: 1em 0 0.4em; line-height: 1.3; }
  .markdown-preview h3 { font-size: 1.2em; font-weight: 600; color: #e6edf3; margin: 0.8em 0 0.3em; }
  .markdown-preview h4, .markdown-preview h5, .markdown-preview h6 { font-size: 1em; font-weight: 600; color: #8b949e; margin: 0.6em 0 0.2em; }
  .markdown-preview p { margin: 0.6em 0; color: #c9d1d9; }
  .markdown-preview strong { color: #e6edf3; font-weight: 700; }
  .markdown-preview em { color: #a5d6ff; font-style: italic; }
  .markdown-preview del { color: #484f58; text-decoration: line-through; }
  .markdown-preview a { color: #f0b429; text-decoration: none; border-bottom: 1px solid rgba(240,180,41,0.3); transition: border-color 0.15s; }
  .markdown-preview a:hover { border-color: #f0b429; }
  .markdown-preview hr { border: none; border-top: 1px solid #30363d; margin: 1.5em 0; }
  .markdown-preview blockquote { border-left: 3px solid #f0b429; margin: 1em 0; padding: 0.5em 1em; color: #8b949e; font-style: italic; background: rgba(240,180,41,0.04); border-radius: 0 4px 4px 0; }
  .markdown-preview .code-block { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 1em 1.2em; margin: 1em 0; overflow-x: auto; }
  .markdown-preview .code-block code { font-family: 'DM Mono', 'Fira Code', monospace; font-size: 13px; color: #a5d6ff; line-height: 1.6; }
  .markdown-preview .inline-code { background: #161b22; border: 1px solid #30363d; border-radius: 4px; padding: 0.1em 0.4em; font-family: 'DM Mono', monospace; font-size: 0.88em; color: #ffa657; }
  .markdown-preview ul { margin: 0.5em 0; padding-left: 1.4em; list-style: none; }
  .markdown-preview li { margin: 0.25em 0; position: relative; padding-left: 0.5em; }
  .markdown-preview li::before { content: '✦'; color: #f0b429; position: absolute; left: -1.2em; font-size: 0.65em; top: 0.38em; }
  .markdown-preview li.task::before, .markdown-preview li.ordered::before { display: none; }
  .markdown-preview li.ordered { list-style: decimal; }
  .markdown-preview .task { display: flex; align-items: center; gap: 8px; padding-left: 0; }
  .markdown-preview .checkbox { width: 16px; height: 16px; border: 1.5px solid #484f58; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
  .markdown-preview .checkbox.checked { background: #f0b429; border-color: #f0b429; color: #0d0f14; font-weight: 700; }
  .markdown-preview table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 13.5px; }
  .markdown-preview th { background: #161b22; color: #f0b429; padding: 8px 12px; text-align: left; font-size: 11px; letter-spacing: 0.8px; text-transform: uppercase; border: 1px solid #21262d; }
  .markdown-preview td { padding: 8px 12px; border: 1px solid #21262d; color: #c9d1d9; }
  .markdown-preview tr:hover td { background: rgba(255,255,255,0.02); }
`;
