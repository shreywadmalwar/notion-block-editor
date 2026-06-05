// Code block: the classic transparent-textarea-over-highlighted-pre overlay.
// prism-react-renderer produces beautifully tokenized but read-only output,
// so editing happens in an invisible textarea stacked exactly on top of it —
// same font, same padding, same line height — with transparent text and a
// visible caret. The user "types into" the highlighted view without us
// writing a caret-preserving syntax editor by hand.
//
// Unlike the rich-text blocks, content here is plain text (never HTML), which
// is also what the markdown exporter expects when it emits the fenced block.

import { useEffect, useRef, useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { useTheme } from '../theme'

const LANGUAGES = ['javascript', 'jsx', 'typescript', 'python', 'css', 'markup', 'bash', 'json', 'sql', 'go', 'rust']

export default function CodeBlock({ block, editor }) {
  const textareaRef = useRef(null)
  const [copied, setCopied] = useState(false)
  // Prism's palette can't follow CSS variables — pick per theme instead.
  const theme = useTheme()

  const copy = async () => {
    await navigator.clipboard.writeText(block.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Honor pending focus requests, same contract as ContentEditable.
  useEffect(() => {
    const req = editor.consumeFocus(block.id)
    if (req && textareaRef.current) {
      const el = textareaRef.current
      el.focus()
      const pos = req.position === 'start' ? 0 : el.value.length
      el.setSelectionRange(pos, pos)
    }
  })

  const onKeyDown = (e) => {
    // Enter stays inside the block (newlines are the point of a code block);
    // Mod+Enter is the escape hatch that creates a paragraph below.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      editor.insertBlockAfter(block.id)
    } else if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault()
      editor.deleteBlock(block.id)
    } else if (e.key === 'Tab') {
      // Insert two spaces instead of tabbing focus away — losing focus from
      // a code editor on Tab is the fastest way to make it feel broken.
      e.preventDefault()
      const el = e.currentTarget
      const { selectionStart, selectionEnd, value } = el
      const next = value.slice(0, selectionStart) + '  ' + value.slice(selectionEnd)
      editor.updateBlock(block.id, { content: next })
      // React will re-render with the new value; restore the caret after.
      requestAnimationFrame(() => el.setSelectionRange(selectionStart + 2, selectionStart + 2))
    }
  }

  // Shared metrics for both layers — any drift between textarea and pre
  // misaligns the caret from the text it appears to edit.
  const sharedStyle = 'font-mono text-[13px] leading-[1.6] p-4 whitespace-pre-wrap break-words'

  return (
    <div className="group/code relative my-1 rounded-md bg-codebg border border-line">
      {/* Copy + language picker, faded until the block is hovered. */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 group-hover/code:opacity-100 focus-within:opacity-100 coarse:opacity-100 transition-opacity print-hidden">
        <button
          onClick={copy}
          title="Copy code"
          className="rounded px-1.5 py-0.5 text-xs text-ink-light hover:bg-hov hover:text-ink"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <select
          value={block.language}
          onChange={(e) => editor.updateBlock(block.id, { language: e.target.value })}
          className="text-xs text-ink-light bg-transparent cursor-pointer outline-none"
        >
          {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
        </select>
      </div>

      <div className="relative">
        {/* Highlighted layer: pointer-events pass through to the textarea.
            The trailing newline keeps the pre's height in step with the
            textarea when the content ends in an empty line. */}
        <Highlight
          theme={theme === 'dark' ? themes.vsDark : themes.vsLight}
          code={block.content + '\n'}
          language={block.language || 'javascript'}
        >
          {({ tokens, getLineProps, getTokenProps }) => (
            {/* !bg-transparent: the prism theme ships its own background,
                but the block's surface token must win for theming. */}
            <pre aria-hidden className={`${sharedStyle} pointer-events-none m-0 !bg-transparent`}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, j) => <span key={j} {...getTokenProps({ token })} />)}
                </div>
              ))}
            </pre>
          )}
        </Highlight>

        <textarea
          ref={textareaRef}
          value={block.content}
          spellCheck={false}
          placeholder="// code"
          onChange={(e) => editor.updateBlock(block.id, { content: e.target.value })}
          onKeyDown={onKeyDown}
          // text-transparent lets the highlighted layer show through, but it
          // would also hide the placeholder — restore its color explicitly.
          className={`${sharedStyle} absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-ink outline-none placeholder:text-faint`}
        />
      </div>
    </div>
  )
}
