// Collapsible left rail: document list plus the export actions. When
// collapsed it shrinks to zero width (rather than unmounting) so reopening
// is instant and scroll position survives. The whole rail is print-hidden —
// PDF export must show only the document.

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
  onExportMarkdown,
  onExportPDF,
}) {
  // Title search — a flat list stops scaling past ~10 documents. Filtering
  // here keeps DocumentList dumb and the query out of App.
  const [query, setQuery] = useState('')
  const visible = query.trim()
    ? docs.filter((d) => (d.title || 'untitled').toLowerCase().includes(query.toLowerCase()))
    : docs

  return (
    <aside
      className={`print-hidden shrink-0 overflow-hidden border-r border-black/5 bg-wash transition-[width] duration-200 ${
        open ? 'w-60' : 'w-0 border-r-0'
      }`}
    >
      {/* Fixed inner width prevents the content reflowing during the
          collapse animation — it slides out of view instead of squishing. */}
      <div className="flex h-full w-60 flex-col pb-3 pt-4">
        {/* Nude/charcoal header: a quiet uppercase label in warm grey with a
            bordered + that reads as a real control, not a stray glyph. */}
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#79766f]">
            Documents
          </span>
          <button
            onClick={onCreate}
            title="New document"
            aria-label="New document"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-[#e3e1dc] bg-[#fbfbfa] text-[15px] leading-none text-[#79766f] shadow-sm transition-colors hover:border-[#d6d3cc] hover:bg-white hover:text-[#37352f]"
          >
            +
          </button>
        </div>

        {/* Search sits flush in the wash as a soft inset field, sharpening
            to white + charcoal text only when focused. */}
        <div className="px-3 pb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-md border border-transparent bg-[#37352f]/[0.055] px-2.5 py-1.5 text-sm text-[#37352f] outline-none transition-colors placeholder:text-[#9b9a97] focus:border-[#d6d3cc] focus:bg-white"
          />
        </div>

        <DocumentList
          docs={visible}
          activeId={activeId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />

        {/* Export lives at the bottom, away from the writing flow — same
            warm-grey voice as the header, darkening to charcoal on hover. */}
        <div className="mt-auto flex flex-col gap-0.5 border-t border-[#e9e7e2] px-2 pt-3">
          <button
            onClick={onExportMarkdown}
            className="rounded-md px-2 py-1.5 text-left text-sm text-[#79766f] transition-colors hover:bg-[#37352f]/[0.05] hover:text-[#37352f]"
          >
            ↓ Export Markdown
          </button>
          <button
            onClick={onExportPDF}
            className="rounded-md px-2 py-1.5 text-left text-sm text-[#79766f] transition-colors hover:bg-[#37352f]/[0.05] hover:text-[#37352f]"
          >
            ↓ Export PDF
          </button>
        </div>
      </div>
    </aside>
  )
}
