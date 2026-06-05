/** @type {import('tailwindcss').Config} */
export default {
  // Scan the index.html plus everything under src — all our class names live
  // in JSX, so this is enough for the JIT compiler to see every utility we use.
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Notion uses a quiet, slightly warm grey palette rather than pure
      // neutral — these two custom tones cover the sidebar wash and the
      // soft ink color used for body text.
      colors: {
        paper: '#ffffff',
        wash: '#f7f7f5',
        ink: '#37352f',
        'ink-light': '#9b9a97',
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
