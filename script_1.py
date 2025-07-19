# Generate root package.json
root_package_json = """{
  "name": "mobile-legends-recharge-platform",
  "version": "1.0.0",
  "description": "Complete Mobile Legends Diamond Recharge Platform with React Frontend and Node.js Backend",
  "scripts": {
    "dev": "concurrently \\"npm run --prefix server dev\\" \\"npm run --prefix client dev\\"",
    "build": "npm run --prefix client build && npm run --prefix server build",
    "start": "node server/dist/app.js",
    "install:all": "npm install && npm install --prefix client && npm install --prefix server",
    "deploy": "npm run build && npm run start"
  },
  "keywords": ["mobile-legends", "gaming", "recharge", "react", "nodejs"],
  "author": "P&K Store",
  "license": "MIT",
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}"""

with open(f"{base_dir}/package.json", "w") as f:
    f.write(root_package_json)

# Generate .env.example
env_example = """# Azure SQL Configuration
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DB=mlbb_users
AZURE_SQL_USER=your-admin-user
AZURE_SQL_PWD=your-strong-password

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# Session Configuration
SESSION_SECRET=your-64-character-random-session-secret-here-change-this-in-production

# WhatsApp Configuration
WHATSAPP_NUM=919362584929

# Admin Configuration
ADMIN_SECRET_PATH=superadmin-9d2f1b6d

# Environment
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:5173

# Production URLs (update for deployment)
# GOOGLE_CALLBACK_URL=https://heisnam.tech/api/auth/google/callback
# CLIENT_URL=https://heisnam.tech
"""

with open(f"{base_dir}/.env.example", "w") as f:
    f.write(env_example)

print("Root configuration files created!")