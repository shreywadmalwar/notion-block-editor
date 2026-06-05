// App shell: owns which document is open, the sidebar, and persistence.
// The Editor is remounted via key={doc.id} on every switch — a deliberate
// choice that wipes all transient editor state (focus, menus, selection)
// without a single line of reset logic.

import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import { useAutoSave } from './hooks/useAutoSave'
import { listDocuments, loadDocument, createDocument, createStarterDocument, deleteDocument, saveDocument } from './services/storage'
import { downloadMarkdown } from './services/exportMarkdown'
import { exportPDF } from './services/exportPDF'

export default function App() {
  const [docs, setDocs] = useState(() => listDocuments())
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Open the most recent doc; a completely fresh browser gets the guided
  // starter document instead of a blank page.
  const [doc, setDoc] = useState(() => {
    const existing = listDocuments()
    if (existing.length > 0) {
      const loaded = loadDocument(existing[0].id)
      if (loaded) return loaded
    }
    return createStarterDocument()
  })

  const saveStatus = useAutoSave(doc)

  // ⌘\ / Ctrl+\ toggles the sidebar — it's collapsible, so it must also be
  // reachable without the mouse (matches Notion's binding).
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setSidebarOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Refresh the sidebar listing once a save lands — titles and ordering both
  // come from the index that saveDocument maintains.
  useEffect(() => {
    if (saveStatus === 'saved') setDocs(listDocuments())
  }, [saveStatus, doc.title])

  const onBlocksChange = useCallback((blocks) => {
    setDoc((d) => (d.blocks === blocks ? d : { ...d, blocks }))
  }, [])

  const onTitleChange = (title) => setDoc((d) => ({ ...d, title }))

  const selectDoc = (id) => {
    if (id === doc.id) return
    // Persist the outgoing doc immediately — don't gamble on the debounce.
    saveDocument(doc)
    const next = loadDocument(id)
    if (next) setDoc(next)
    setDocs(listDocuments())
  }

  const createDoc = () => {
    saveDocument(doc)
    setDoc(createDocument())
    setDocs(listDocuments())
  }

  const removeDoc = (id) => {
    deleteDocument(id)
    const remaining = listDocuments()
    // Deleting the open doc falls back to the next one, or a fresh start —
    // the editor never points at a document that no longer exists.
    if (id === doc.id) {
      setDoc(remaining.length ? loadDocument(remaining[0].id) : createDocument())
    }
    setDocs(listDocuments())
  }

  const renameDoc = (id, title) => {
    if (id === doc.id) {
      onTitleChange(title)
    } else {
      const target = loadDocument(id)
      if (target) saveDocument({ ...target, title })
    }
    setDocs(listDocuments())
  }

  return (
    <div className="flex h-screen bg-paper text-ink">
      <Sidebar
        open={sidebarOpen}
        docs={docs}
        activeId={doc.id}
        onSelect={selectDoc}
        onCreate={createDoc}
        onRename={renameDoc}
        onDelete={removeDoc}
        onExportMarkdown={() => downloadMarkdown(doc.blocks, doc.title)}
        onExportPDF={() => exportPDF(doc.title)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Sidebar toggle + save indicator float in the top corner, outside
            the writing column, so the canvas itself stays empty. */}
        <div className="print-hidden absolute left-2 top-2 z-10 flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
            className="rounded p-1.5 text-ink-light hover:bg-black/5 hover:text-ink"
          >
            {sidebarOpen ? '«' : '☰'}
          </button>
          {/* Autosave is invisible while it works — status changes draw the
              eye, and "Saving…/Saved" flicker on every pause is noise. Only
              failure deserves attention. */}
          {saveStatus === 'error' && (
            <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">
              Couldn't save — storage may be full
            </span>
          )}
        </div>

        <Editor
          key={doc.id}
          doc={doc}
          onBlocksChange={onBlocksChange}
          onTitleChange={onTitleChange}
        />
      </main>
    </div>
  )
}
