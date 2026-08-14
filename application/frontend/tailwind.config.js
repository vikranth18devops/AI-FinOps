/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090d16',
          900: '#0f172a',
          850: '#151f32',
          800: '#1e293b',
          700: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Share Tech Mono"', 'monospace'],
        cyber: ['Nerdropol', 'Orbitron', '"Chakra Petch"', 'Rajdhani', 'sans-serif'],
        display: ['Nerdropol', 'Orbitron', '"Chakra Petch"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
