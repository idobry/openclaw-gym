import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0D0D12",
        surface: "#1A1A24",
        raised: "#242430",
        accent: "#6C5CE7",
        "accent-hover": "#7B6EF6",
        success: "#34D399",
        "text-primary": "#F5F5FA",
        "text-secondary": "#7B7B94",
        border: "#2A2A3C",
      },
      borderRadius: {
        card: "14px",
        lg: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
