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
      className={`group flex items-center gap-1.5 rounded px-2 py-1 text-sm cursor-pointer ${
        isActive ? 'bg-black/[0.06] text-ink' : 'text-ink/80 hover:bg-black/[0.04]'
      }`}
      onClick={() => onSelect(doc.id)}
      onDoubleClick={() => setEditing(true)}
    >
      <span className="text-ink-light shrink-0">📄</span>
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
          className="w-full bg-white rounded border border-black/10 px-1 outline-none"
        />
      ) : (
        <span className="min-w-0 flex-1">
          <span className={`block truncate ${isActive ? 'font-medium' : ''}`}>
            {doc.title || 'Untitled'}
          </span>
          <span className="block text-[10px] leading-tight text-ink-light/80">
            {timeAgo(doc.updatedAt)}
          </span>
        </span>
      )}

      {confirming ? (
        <span className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            title="Confirm delete"
            onClick={() => onDelete(doc.id)}
            className="rounded px-1 text-red-500 hover:bg-red-50"
          >
            ✓
          </button>
          <button
            title="Cancel"
            onClick={() => setConfirming(false)}
            className="rounded px-1 text-ink-light hover:bg-black/5"
          >
            ✕
          </button>
        </span>
      ) : (
        <button
          title="Delete document"
          onClick={(e) => {
            e.stopPropagation()
            setConfirming(true)
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100 coarse:opacity-60 text-ink-light hover:text-red-500 px-1 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default function DocumentList({ docs, activeId, onSelect, onRename, onDelete }) {
  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto px-2">
      {docs.length === 0 && (
        <div className="px-2 py-3 text-xs text-ink-light">No matching documents</div>
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
