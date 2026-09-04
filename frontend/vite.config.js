import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // This allows your specific ngrok URL and any other ngrok-free.dev subdomains
    allowedHosts: [
      'preludiously-needless-jaylee.ngrok-free.dev', 
      '.ngrok-free.dev' // The dot at the start allows all subdomains
    ]
  }

})
