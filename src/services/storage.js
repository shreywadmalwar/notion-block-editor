// localStorage persistence, split into two layers: a lightweight index of
// document metadata (for the sidebar, which shouldn't have to parse every
// document just to list titles) and one key per document holding its full
// block array. This keeps document switches cheap and avoids one giant blob
// that gets rewritten on every keystroke of every doc.

import { BlockType, createBlock } from '../types/blockTypes'

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
  // setItem throws on quota overflow and in some private-browsing modes.
  // Returning false (instead of throwing) lets the autosave layer surface
  // "couldn't save" honestly — a silently false "Saved" indicator is worse
  // than no indicator at all.
  try {
    const updatedAt = Date.now()
    localStorage.setItem(DOC_PREFIX + doc.id, JSON.stringify({ ...doc, updatedAt }))

    // Keep the index in sync: replace this doc's entry (or append it)
    // without touching the others.
    const index = readJSON(INDEX_KEY, []).filter((d) => d.id !== doc.id)
    index.push({ id: doc.id, title: doc.title, updatedAt })
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
    return true
  } catch {
    return false
  }
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

// The very first thing a new user sees. A blinking cursor on a blank page
// teaches nothing; a short document that *demonstrates* each feature teaches
// the whole editor in ten seconds of reading. Only created when no documents
// exist yet — never re-imposed on someone who deleted it.
export function createStarterDocument() {
  const doc = {
    id: crypto.randomUUID(),
    title: 'Getting started',
    blocks: [
      createBlock(BlockType.HEADING1, 'Welcome 👋'),
      createBlock(BlockType.PARAGRAPH,
        'This is a block-based editor. Every line is a block you can transform, reorder and style.'),
      createBlock(BlockType.HEADING2, 'The basics'),
      createBlock(BlockType.BULLETED, 'Type <code>/</code> on an empty line to insert any block type'),
      createBlock(BlockType.BULLETED, 'Select text to format it — or use <b>⌘B</b>, <i>⌘I</i>, <u>⌘U</u>, <code>⌘`</code>'),
      createBlock(BlockType.BULLETED, 'Hover a block and drag the dots on the left to reorder'),
      createBlock(BlockType.BULLETED,
        'Start a line with <code># </code>, <code>- </code> or <code>1. </code> and it transforms as you type'),
      createBlock(BlockType.QUOTE, 'Press ⌘Z to undo anything — including deletes and moves.'),
      createBlock(BlockType.CODE,
        '// Code blocks highlight as you type\nconst greet = (name) => `Hello, ${name}!`',
        { language: 'javascript' }),
      createBlock(BlockType.DIVIDER),
      createBlock(BlockType.PARAGRAPH,
        'Create your own document from the sidebar (⌘\\ toggles it). Happy writing!'),
    ],
  }
  saveDocument(doc)
  return doc
}
