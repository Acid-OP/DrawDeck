import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "../../packages/ui/**/*.{ts,tsx}", // <-- Add this line
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
