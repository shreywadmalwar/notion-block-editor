// The select-to-format toolbar. Editor watches selectionchange and passes the
// selection rect when a non-collapsed selection lives inside the content
// column; this just positions itself above it and fires format commands.

import { applyFormat } from '../hooks/useKeyboard'

const BUTTONS = [
  { command: 'bold', label: 'B', title: 'Bold (⌘B)', className: 'font-bold' },
  { command: 'italic', label: 'I', title: 'Italic (⌘I)', className: 'italic font-serif' },
  { command: 'underline', label: 'U', title: 'Underline (⌘U)', className: 'underline' },
  { command: 'code', label: '</>', title: 'Inline code (⌘`)', className: 'font-mono text-[11px]' },
]

export default function FloatingToolbar({ rect, active = {} }) {
  if (!rect) return null

  // Center over the selection, clamped so it never slides off-screen on
  // selections near the column edges.
  const left = Math.max(8, Math.min(rect.left + rect.width / 2 - 80, window.innerWidth - 168))

  return (
    <div
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-black/10 bg-white p-1 shadow-lg shadow-black/10 print-hidden"
      style={{ left, top: Math.max(8, rect.top - 44) }}
      // Swallow mousedown so clicking a button doesn't collapse the text
      // selection it's meant to format.
      onMouseDown={(e) => e.preventDefault()}
    >
      {BUTTONS.map((btn) => (
        <button
          key={btn.command}
          title={btn.title}
          aria-pressed={!!active[btn.command]}
          onClick={() => applyFormat(btn.command)}
          // Active formats get a filled background so the button reads as a
          // toggle — the user can tell whether pressing adds or removes.
          className={`flex h-7 w-9 items-center justify-center rounded text-sm hover:bg-black/5 ${
            active[btn.command] ? 'bg-black/10 text-ink' : 'text-ink'
          } ${btn.className}`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}
