// localStorage persistence, split into two layers: a lightweight index of
// document metadata (for the sidebar, which shouldn't have to parse every
// document just to list titles) and one key per document holding its full
// block array. This keeps document switches cheap and avoids one giant blob
// that gets rewritten on every keystroke of every doc.

import { createBlock } from '../types/blockTypes'

const INDEX_KEY = 'nbe:index'
const DOC_PREFIX = 'nbe:doc:'

function readJSON(key, fallback) {
  // localStorage can hold stale or hand-edited junk; a parse failure should
  // degrade to "no data" rather than take the whole app down.
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function listDocuments() {
  // Most recently edited first — the doc you were just working on is almost
  // always the one you want next session.
  return readJSON(INDEX_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function loadDocument(id) {
  return readJSON(DOC_PREFIX + id, null)
}

export function saveDocument(doc) {
  const updatedAt = Date.now()
  localStorage.setItem(DOC_PREFIX + doc.id, JSON.stringify({ ...doc, updatedAt }))

  // Keep the index in sync: replace this doc's entry (or append it) without
  // touching the others.
  const index = readJSON(INDEX_KEY, []).filter((d) => d.id !== doc.id)
  index.push({ id: doc.id, title: doc.title, updatedAt })
  localStorage.setItem(INDEX_KEY, JSON.stringify(index))
  return updatedAt
}

export function deleteDocument(id) {
  localStorage.removeItem(DOC_PREFIX + id)
  const index = readJSON(INDEX_KEY, []).filter((d) => d.id !== id)
  localStorage.setItem(INDEX_KEY, JSON.stringify(index))
}

export function createDocument(title = 'Untitled') {
  // A new doc starts with one empty paragraph so the editor always has a
  // block to focus — an empty block array would leave the cursor nowhere.
  const doc = {
    id: crypto.randomUUID(),
    title,
    blocks: [createBlock()],
  }
  saveDocument(doc)
  return doc
}
