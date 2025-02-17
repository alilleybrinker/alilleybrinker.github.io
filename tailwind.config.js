/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./templates/**/*.html",
    "./public/**/*.html",
    "./content/**/*.md",
    "config.toml",
  ],
  theme: {
    fontFamily: {
      sans: ["Inter", "sans-serif"],
    },
  },
  plugins: [
    // Use the standard typography plugin
    require("@tailwindcss/typography"),
  ],
  // Use a selector to set dark mode.
  darkMode: "selector",
};
