// Collapsible left rail: document list plus the new-document and search
// controls. When collapsed it shrinks to zero width (rather than unmounting)
// so reopening is instant and scroll position survives. The whole rail is
// print-hidden — PDF export must show only the document.
//
// All colors are semantic tokens (wash, line, ink-light…) so the rail
// re-skins automatically when the theme flips.

import { useState } from 'react'
import DocumentList from './DocumentList'

export default function Sidebar({
  open,
  docs,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}) {
  // Title search — a flat list stops scaling past ~10 documents. Filtering
  // here keeps DocumentList dumb and the query out of App.
  const [query, setQuery] = useState('')
  const visible = query.trim()
    ? docs.filter((d) => (d.title || 'untitled').toLowerCase().includes(query.toLowerCase()))
    : docs

  return (
    <aside
      className={`print-hidden shrink-0 overflow-hidden border-r border-line bg-wash transition-[width] duration-200 ${
        open ? 'w-60' : 'w-0 border-r-0'
      }`}
    >
      {/* Fixed inner width prevents the content reflowing during the
          collapse animation — it slides out of view instead of squishing. */}
      <div className="flex h-full w-60 flex-col pb-3 pt-4">
        {/* A quiet uppercase label with a bordered + that reads as a real
            control, not a stray glyph. */}
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-light">
            Documents
          </span>
          <button
            onClick={onCreate}
            title="New document"
            aria-label="New document"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-paper text-[15px] leading-none text-ink-light shadow-sm transition-colors hover:border-line-strong hover:text-ink"
          >
            +
          </button>
        </div>

        {/* Search sits flush in the wash as a soft inset field, sharpening
            to the paper surface only when focused. */}
        <div className="px-3 pb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-md border border-transparent bg-field px-2.5 py-1.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-line-strong focus:bg-paper"
          />
        </div>

        <DocumentList
          docs={visible}
          activeId={activeId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
    </aside>
  )
}
