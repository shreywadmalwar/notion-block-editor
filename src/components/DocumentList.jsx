// The sidebar's document rows: select, rename (double-click), delete. Rename
// uses a transient input swapped in place — committing on blur or Enter,
// cancelling on Escape — so there's no modal interrupting the flow. Delete
// is an inline two-step (× → ✓/✕) that auto-cancels after a few seconds:
// non-blocking, consistent with the app's design language, and one
// deliberate click away from destruction instead of a system dialog.

import { useEffect, useRef, useState } from 'react'

// Compact relative timestamps for the row metadata — "when did I touch this"
// matters more than the exact date once the list grows.
function timeAgo(ts) {
  if (!ts) return ''
  const s = (Date.now() - ts) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(ts).toLocaleDateString()
}

function DocumentRow({ doc, isActive, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [draft, setDraft] = useState(doc.title)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  // An armed delete disarms itself — a forgotten ✓ shouldn't lie in wait.
  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  const commit = () => {
    setEditing(false)
    const title = draft.trim()
    if (title && title !== doc.title) onRename(doc.id, title)
    else setDraft(doc.title)
  }

  return (
    <div
      // Titles stay at full text strength whether or not the row is active —
      // only the background marks selection. Dimmed titles read as disabled.
      className={`group flex items-center gap-1.5 rounded-md px-2 py-1 text-sm cursor-pointer text-ink transition-colors ${
        isActive ? 'bg-active' : 'hover:bg-hov'
      }`}
      onClick={() => onSelect(doc.id)}
      onDoubleClick={() => setEditing(true)}
    >
      {/* Page glyph drawn inline — emoji render inconsistently across
          platforms and can't follow the theme's text color. */}
      <svg className="shrink-0 text-faint" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setDraft(doc.title); setEditing(false) }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded border border-line-strong bg-paper px-1 text-ink outline-none"
        />
      ) : (
        <span className="min-w-0 flex-1">
          <span className={`block truncate ${isActive ? 'font-medium' : ''}`}>
            {doc.title || 'Untitled'}
          </span>
          <span className="block text-[10px] leading-tight text-ink-light">
            {timeAgo(doc.updatedAt)}
          </span>
        </span>
      )}

      {confirming ? (
        // The armed state is unmissable: a labeled red button, not a pair of
        // cryptic glyphs. Click it to delete; click anywhere else (or wait
        // 3s) and it disarms.
        <button
          title="Click to confirm deletion"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(doc.id)
          }}
          className="shrink-0 rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
        >
          Delete?
        </button>
      ) : (
        <button
          title="Delete document"
          aria-label="Delete document"
          onClick={(e) => {
            e.stopPropagation()
            setConfirming(true)
          }}
          className="shrink-0 rounded p-1.5 opacity-0 group-hover:opacity-100 coarse:opacity-60 text-ink-light hover:bg-red-500/10 hover:text-red-500 transition-opacity"
        >
          {/* Trash can, drawn inline — reads as "delete" at a glance where
              the old × read as "close". */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default function DocumentList({ docs, activeId, onSelect, onRename, onDelete }) {
  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto px-2">
      {docs.length === 0 && (
        <div className="px-2 py-3 text-xs text-faint">No matching documents</div>
      )}
      {docs.map((doc) => (
        <DocumentRow
          key={doc.id}
          doc={doc}
          isActive={doc.id === activeId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
