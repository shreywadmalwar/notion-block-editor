// Debounced persistence: every change restarts a 2-second timer, so we write
// to localStorage once typing pauses instead of on every keystroke. The
// "saved / saving" status feeds the little indicator in the bottom bar — the
// quiet reassurance that closing the tab won't lose work.

import { useEffect, useRef, useState } from 'react'
import { saveDocument } from '../services/storage'

export function useAutoSave(doc) {
  const [status, setStatus] = useState('saved')

  // Keep the latest doc in a ref so the unmount flush below can save it
  // without re-binding the cleanup on every keystroke.
  const docRef = useRef(doc)
  docRef.current = doc

  // Skip the very first run — the doc was just loaded from storage, writing
  // it straight back is pointless churn.
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    setStatus('saving')
    const timer = setTimeout(() => {
      saveDocument(docRef.current)
      setStatus('saved')
    }, 2000)
    return () => clearTimeout(timer)
  }, [doc])

  // Flush on unmount (document switch, app close via React teardown) so the
  // trailing edge of the debounce never drops an edit.
  useEffect(() => {
    return () => saveDocument(docRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return status
}
