// The About page. Static content rendered in place of the editor when the
// user clicks "About" in the nav bar. Same centered column as the editor so
// the app feels consistent between the two views.

export default function About({ onBack }) {
  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] flex-1 px-8 pb-32 pt-16">
        <h1 className="mb-6 text-[40px] font-bold leading-tight text-ink">About this project</h1>

        <div className="space-y-5 text-[16px] leading-7 text-ink">
          <p>
            This is a block based text editor, built in the style of Notion.
            Everything you write lives in blocks. A block can be a paragraph,
            a heading, a list item, a quote, a divider, or a piece of code.
            You can move blocks around, change one type into another, and
            style the text inside them.
          </p>

          <h2 className="pt-4 text-[22px] font-semibold">Why blocks?</h2>
          <p>
            A normal text editor treats your document as one long stream of
            text. That makes it hard to move a section, or turn a paragraph
            into a list, without a lot of cutting and pasting. When every
            piece is its own block, you can grab it, drag it, and reshape it
            on its own. The rest of the document stays untouched.
          </p>

          <h2 className="pt-4 text-[22px] font-semibold">What it can do</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Type <code>/</code> on an empty line to pick a block type from a menu.</li>
            <li>Start a line with <code>#</code>, <code>-</code> or <code>1.</code> and a space, and the block changes as you type.</li>
            <li>Select some text and a small toolbar appears for bold, italic, underline and inline code.</li>
            <li>Hover over a block and drag the dots on the left to reorder it.</li>
            <li>Press Ctrl+Z (or Cmd+Z on Mac) to undo anything, including deleted or moved blocks.</li>
            <li>Code blocks highlight your code as you write, in more than ten languages.</li>
            <li>Keep as many documents as you want, and search them from the sidebar.</li>
            <li>Export any document as a Markdown file or print it to PDF.</li>
            <li>Switch between a light and a dark look from the top bar.</li>
          </ul>

          <h2 className="pt-4 text-[22px] font-semibold">Where your writing goes</h2>
          <p>
            Nowhere. There is no server and no account. Your documents are
            saved inside your own browser, in a small storage area that
            websites get for keeping data on your machine. Saving happens on
            its own, about two seconds after you stop typing. The trade off
            is that your documents stay on this browser only. If you clear
            your browser data, they are gone, so export anything you care
            about.
          </p>

          <h2 className="pt-4 text-[22px] font-semibold">How it is built</h2>
          <p>
            The app is written in JavaScript with React and built with Vite.
            Styling is done with Tailwind CSS. Drag and drop comes from the
            dnd-kit library, and code highlighting from prism-react-renderer.
            The whole thing is a static site, which is why it can be hosted
            on GitHub Pages for free.
          </p>
          <p>
            The source code lives on{' '}
            <a
              href="https://github.com/shreywadmalwar/notion-block-editor"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-line-strong underline-offset-2 hover:decoration-ink"
            >
              GitHub
            </a>
            . Feel free to read it, fork it, or open an issue.
          </p>

          <div className="pt-6">
            <button
              onClick={onBack}
              className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink-light shadow-sm transition-colors hover:border-line-strong hover:text-ink"
            >
              ← Back to writing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
