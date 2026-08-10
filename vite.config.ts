import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base ต้องตรงกับชื่อ repo เพราะ deploy เป็น GitHub Pages project site
// https://chanopk.github.io/tcgtools/
export default defineConfig({
  base: '/tcgtools/',
  plugins: [react(), tailwindcss()],
})
