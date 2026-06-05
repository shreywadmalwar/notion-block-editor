// Tailwind v3 runs as a PostCSS plugin; autoprefixer rides along so we don't
// have to think about vendor prefixes for things like ::selection or print css.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
