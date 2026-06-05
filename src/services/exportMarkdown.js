// Blocks → Markdown. Block-level structure is a straightforward mapping
// (heading depth, list markers, fences), but inline formatting lives as HTML
// inside each block's content string, so we lean on the browser's own parser
// to walk it and re-emit markdown syntax. DOMParser is safe here — it never
// executes scripts — and far more robust than regexing HTML.

import { BlockType } from '../types/blockTypes'

// Recursively convert a DOM node's children into markdown-flavored text.
// Formatting tags can nest (bold inside italic etc.), so each element wraps
// the converted text of its own children rather than its raw textContent.
function inlineToMarkdown(node) {
  let out = ''
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent
      continue
    }
    const inner = inlineToMarkdown(child)
    switch (child.nodeName) {
      case 'B':
      case 'STRONG':
        out += `**${inner}**`
        break
      case 'I':
      case 'EM':
        out += `*${inner}*`
        break
      case 'CODE':
        out += `\`${inner}\``
        break
      case 'U':
        // Markdown has no underline; the conventional escape hatch is to keep
        // the raw <u> tag, which most renderers pass through.
        out += `<u>${inner}</u>`
        break
      case 'BR':
        out += '\n'
        break
      default:
        // Spans, fonts, anything contentEditable smuggled in — keep the text,
        // drop the wrapper.
        out += inner
    }
  }
  return out
}

function htmlToMarkdown(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return inlineToMarkdown(doc.body)
}

export function blocksToMarkdown(blocks, title) {
  const lines = []
  if (title) lines.push(`# ${title}`, '')

  let numberedCounter = 0
  for (const block of blocks) {
    // Numbered lists restart whenever the run of numbered blocks is broken —
    // mirroring how the editor displays them.
    if (block.type !== BlockType.NUMBERED) numberedCounter = 0

    const text = htmlToMarkdown(block.content || '')
    const indentPad = '  '.repeat(block.indent || 0)

    switch (block.type) {
      case BlockType.HEADING1:
        lines.push(`# ${text}`, '')
        break
      case BlockType.HEADING2:
        lines.push(`## ${text}`, '')
        break
      case BlockType.HEADING3:
        lines.push(`### ${text}`, '')
        break
      case BlockType.BULLETED:
        lines.push(`${indentPad}- ${text}`)
        break
      case BlockType.NUMBERED:
        numberedCounter += 1
        lines.push(`${indentPad}${numberedCounter}. ${text}`)
        break
      case BlockType.CODE:
        // Code content is stored as plain text, not HTML — emit it verbatim
        // inside a fence tagged with the block's language.
        lines.push('```' + (block.language || ''), block.content || '', '```', '')
        break
      case BlockType.QUOTE:
        lines.push(`> ${text}`, '')
        break
      case BlockType.DIVIDER:
        lines.push('---', '')
        break
      default:
        lines.push(text, '')
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

export function downloadMarkdown(blocks, title) {
  // The classic invisible-anchor download trick — no backend, the blob lives
  // and dies entirely in the browser.
  const md = blocksToMarkdown(blocks, title)
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(title || 'untitled').replace(/[^\w\- ]+/g, '').trim() || 'untitled'}.md`
  a.click()
  URL.revokeObjectURL(url)
}
