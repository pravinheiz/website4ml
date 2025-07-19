# Generate client package.json
client_package_json = """{
  "name": "mlbb-recharge-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.0.18",
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.2",
    "react-router-dom": "^6.20.1",
    "tsparticles": "^3.0.3",
    "react-countup": "^6.5.0",
    "framer-motion": "^10.16.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.1.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}"""

# Generate server package.json
server_package_json = """{
  "name": "mlbb-recharge-server",
  "version": "1.0.0",
  "description": "Backend API for Mobile Legends Recharge Platform",
  "main": "dist/app.js",
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-local": "^1.0.0",
    "bcryptjs": "^2.4.3",
    "mssql": "^10.0.1",
    "joi": "^17.11.0",
    "dotenv": "^16.3.1",
    "csrf": "^3.1.0",
    "connect-session-sequelize": "^7.1.7"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.17.10",
    "@types/passport": "^1.0.16",
    "@types/passport-google-oauth20": "^2.0.14",
    "@types/passport-local": "^1.0.38",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "tsx": "^4.6.0",
    "typescript": "^5.2.2"
  }
}"""

# Write package.json files
with open(f"{base_dir}/client/package.json", "w") as f:
    f.write(client_package_json)

with open(f"{base_dir}/server/package.json", "w") as f:
    f.write(server_package_json)

print("Package.json files created for client and server!")