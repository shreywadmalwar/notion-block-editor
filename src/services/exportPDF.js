// "Export to PDF" is really just window.print() plus a print stylesheet
// (see the @media print rules in index.css) that strips away the sidebar,
// toolbars and hover chrome so only the document column renders. Every OS
// print dialog offers "Save as PDF", which gives us perfectly paginated
// output for free — no PDF library, no canvas rasterizing blurry text.

export function exportPDF(title) {
  // The printed page picks up document.title as its default filename in the
  // save dialog, so borrow the doc title for the duration of the print and
  // restore afterwards.
  const previous = document.title
  if (title) document.title = title
  window.print()
  document.title = previous
}
