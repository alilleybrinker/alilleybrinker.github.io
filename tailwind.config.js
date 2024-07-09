/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./templates/**/*.html",
    "./public/**/*.html",
    "./content/**/*.md",
    "config.toml",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use Inter as the default font, but otherwise use
        // the default sans-serif font.
        sans: ['"Inter"', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    // Use the standard typography plugin
    require("@tailwindcss/typography"),
  ],
  // Use a selector to set dark mode.
  darkMode: "selector",
};
