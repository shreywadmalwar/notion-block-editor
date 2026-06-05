// The sidebar's document rows: select, rename (double-click), delete. Rename
// uses a transient input swapped in place — committing on blur or Enter,
// cancelling on Escape — so there's no modal interrupting the flow.

import { useEffect, useRef, useState } from 'react'

function DocumentRow({ doc, isActive, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(doc.title)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = () => {
    setEditing(false)
    const title = draft.trim()
    if (title && title !== doc.title) onRename(doc.id, title)
    else setDraft(doc.title)
  }

  return (
    <div
      className={`group flex items-center gap-1 rounded px-2 py-1 text-sm cursor-pointer ${
        isActive ? 'bg-black/[0.06] font-medium text-ink' : 'text-ink/80 hover:bg-black/[0.04]'
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
        <span className="flex-1 truncate">{doc.title || 'Untitled'}</span>
      )}
      <button
        title="Delete document"
        onClick={(e) => {
          e.stopPropagation()
          // A document is real work — never delete on a bare click.
          if (confirm(`Delete "${doc.title || 'Untitled'}"?`)) onDelete(doc.id)
        }}
        className="opacity-0 group-hover:opacity-100 text-ink-light hover:text-red-500 px-1 transition-opacity"
      >
        ×
      </button>
    </div>
  )
}

export default function DocumentList({ docs, activeId, onSelect, onRename, onDelete }) {
  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto px-2">
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
