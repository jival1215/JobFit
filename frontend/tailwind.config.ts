import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        slateSoft: "#64748b",
        cloud: "#f8fafc",
        line: "#e2e8f0",
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af"
        },
        mint: "#10b981"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem"
      }
    }
  },
  plugins: []
};

export default config;
