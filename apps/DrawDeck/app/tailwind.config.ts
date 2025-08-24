import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "../../packages/ui/**/*.{ts,tsx}", 
  ],
  theme: {
    extend: {
      fontFamily: {
      //   excali: "var(--font-excali)",
      //   virgil: "var(--font-virgil)",
      // },
      custom: ['var(--font-excalifont)', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;
