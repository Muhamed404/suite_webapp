import { heroui } from "@heroui/theme";

/** HeroUI theme aligned with Junior Magnus public website brand */
export default heroui({
  themes: {
    light: {
      colors: {
        primary: {
          50: "#fff4ef",
          100: "#ffe8dc",
          200: "#ffd0b8",
          300: "#ffb08a",
          400: "#ff8f5c",
          500: "#FF6B35",
          600: "#e55a28",
          700: "#c1481f",
          800: "#9d3818",
          900: "#7a2b12",
          DEFAULT: "#FF6B35",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#00D4AA",
          foreground: "#2D3047",
        },
        focus: "#FF6B35",
      },
    },
  },
});
