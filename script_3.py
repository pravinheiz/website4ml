# Generate Tailwind config for client
tailwind_config = """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0a1a35',
        accent: '#00a1ff',
        secondary: '#1a0a35',
        accent2: '#c13cff',
        backgroundDark: '#0a0a1a',
      },
      boxShadow: {
        glow: '0 0 15px #00a1ff',
        glowPink: '0 0 12px #c13cff',
        glowStrong: '0 0 25px #00a1ff',
      },
      animation: {
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        fadeIn: 'fadeIn 1s ease-in',
        slideIn: 'slideIn 0.5s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px #00a1ff' },
          '50%': { boxShadow: '0 0 20px #00a1ff, 0 0 30px #00a1ff' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      fontFamily: {
        gaming: ['Orbitron', 'monospace'],
      },
    },
  },
  plugins: [],
}"""

# Generate PostCSS config
postcss_config = """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}"""

# Generate Vite config
vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})"""

# Generate TypeScript config
tsconfig_json = """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}"""

# Write client config files
with open(f"{base_dir}/client/tailwind.config.js", "w") as f:
    f.write(tailwind_config)

with open(f"{base_dir}/client/postcss.config.js", "w") as f:
    f.write(postcss_config)

with open(f"{base_dir}/client/vite.config.ts", "w") as f:
    f.write(vite_config)

with open(f"{base_dir}/client/tsconfig.json", "w") as f:
    f.write(tsconfig_json)

print("Client configuration files created!")