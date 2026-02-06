/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Eleva Care Brand Colors
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          light: "rgb(var(--color-primary-light) / <alpha-value>)",
          dark: "rgb(var(--color-primary-dark) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
          light: "rgb(var(--color-secondary-light) / <alpha-value>)",
        },
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        foreground: "rgb(var(--color-text) / <alpha-value>)",
        muted: {
          DEFAULT: "rgb(var(--color-text-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-text-muted) / <alpha-value>)",
        },
        border: "rgb(var(--color-border) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        destructive: "rgb(var(--color-error) / <alpha-value>)",
        // Alias for react-native-reusables compatibility
        card: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          foreground: "rgb(var(--color-text) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          foreground: "rgb(var(--color-text) / <alpha-value>)",
        },
        input: "rgb(var(--color-border) / <alpha-value>)",
        ring: "rgb(var(--color-primary) / <alpha-value>)",
      },
      borderRadius: {
        // Design Brief: 8-12px max for cards, 6px for small elements
        none: "0",
        sm: "6px", // Small elements, badges
        md: "8px", // Chips, pills
        lg: "10px", // Cards, containers - DEFAULT
        xl: "12px", // Large cards, modals - MAX
        full: "9999px", // Circular elements only
      },
      fontFamily: {
        // Design Brief: Inter (primary) + DM Sans (secondary)
        sans: ["Inter_400Regular", "System", "sans-serif"],
        inter: ["Inter_400Regular", "System", "sans-serif"],
        "inter-medium": ["Inter_500Medium", "System", "sans-serif"],
        "inter-semibold": ["Inter_600SemiBold", "System", "sans-serif"],
        "inter-bold": ["Inter_700Bold", "System", "sans-serif"],
        display: ["DMSans_700Bold", "System", "sans-serif"],
        "dm-sans": ["DMSans_400Regular", "System", "sans-serif"],
        "dm-sans-medium": ["DMSans_500Medium", "System", "sans-serif"],
        "dm-sans-semibold": ["DMSans_600SemiBold", "System", "sans-serif"],
        "dm-sans-bold": ["DMSans_700Bold", "System", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
