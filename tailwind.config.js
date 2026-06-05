/** @type {import('tailwindcss').Config} */
export default {
  // Scan the index.html plus everything under src — all our class names live
  // in JSX, so this is enough for the JIT compiler to see every utility we use.
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Semantic tokens, not literal colors: each maps to a CSS variable
      // defined per-theme in index.css. Components say what a surface *is*
      // (paper, wash, field) and the active theme decides how it looks —
      // that's what makes the light/dark toggle a one-class flip.
      colors: {
        paper: 'var(--bg-app)',
        wash: 'var(--bg-sidebar)',
        ink: 'var(--text-1)',
        'ink-light': 'var(--text-2)',
        faint: 'var(--text-3)',
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
        hov: 'var(--bg-hover)',
        active: 'var(--bg-active)',
        field: 'var(--bg-field)',
        codebg: 'var(--bg-code)',
      },
    },
  },
  plugins: [
    // `coarse:` variant for touch devices — hover-revealed controls (drag
    // handles, delete buttons, code-block actions) must be permanently
    // visible where hover doesn't exist.
    function ({ addVariant }) {
      addVariant('coarse', '@media (pointer: coarse)')
    },
  ],
}
