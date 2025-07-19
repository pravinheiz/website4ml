# Generate deployment files

# Generate Docker files
dockerfile = """# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

# Build the client
FROM base AS client-builder
WORKDIR /app
COPY client ./client
COPY --from=deps /app/client/node_modules ./client/node_modules
WORKDIR /app/client
RUN npm run build

# Build the server
FROM base AS server-builder
WORKDIR /app
COPY server ./server
COPY --from=deps /app/server/node_modules ./server/node_modules
WORKDIR /app/server
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY server/package.json ./server/

USER nextjs

EXPOSE 4000

ENV PORT 4000

CMD ["node", "server/dist/app.js"]"""

# Generate docker-compose for development
docker_compose_yml = """version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
    env_file:
      - .env
    restart: unless-stopped

  # Optional: Local SQL Server for development
  # sqlserver:
  #   image: mcr.microsoft.com/mssql/server:2019-latest
  #   environment:
  #     - ACCEPT_EULA=Y
  #     - SA_PASSWORD=YourStrong@Password
  #   ports:
  #     - "1433:1433"
  #   volumes:
  #     - sqlserver_data:/var/opt/mssql

volumes:
  sqlserver_data:"""

# Generate Vercel configuration
vercel_json = """{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "server/src/app.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/src/app.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}"""

# Generate README
readme_md = """# Mobile Legends Diamond Recharge Platform

A full-stack web application for Mobile Legends diamond recharge with React frontend, Node.js backend, Azure SQL database, and Google OAuth authentication.

## 🚀 Features

- **User Authentication**: Google OAuth + Email/Password login
- **Diamond Packages**: Multiple diamond packages with bonus offers
- **Order Management**: Real-time order tracking and status updates
- **WhatsApp Integration**: Direct order communication via WhatsApp
- **Admin Panel**: Hidden admin interface for order and user management
- **Responsive Design**: Optimized for mobile and desktop
- **Security**: Rate limiting, CSRF protection, and secure sessions

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- React Hook Form for form handling
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- Passport.js for authentication
- Azure SQL Database
- Express-session for session management

### Deployment
- Vercel (Frontend)
- Azure App Service (Backend)
- Azure SQL Database

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Azure SQL Database
- Google OAuth credentials
- WhatsApp Business account

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mobile_legends_recharge_platform
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

4. **Set up Azure SQL Database**
   - Create an Azure SQL Database
   - Run the SQL scripts in `server/sql/init.sql`
   - Update connection string in `.env`

5. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:4000/api/auth/google/callback`

## 🚀 Development

Start the development servers:

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## 📁 Project Structure

```
mobile_legends_recharge_platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utility functions
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Database and passport config
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── routes/         # API routes
│   │   └── app.ts          # Main application
│   └── sql/                # Database scripts
└── README.md
```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Azure SQL Database
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DB=your-database-name
AZURE_SQL_USER=your-username
AZURE_SQL_PWD=your-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# Session Secret
SESSION_SECRET=your-secret-key

# WhatsApp
WHATSAPP_NUM=919362584929

# Admin
ADMIN_SECRET_PATH=superadmin-9d2f1b6d

# URLs
CLIENT_URL=http://localhost:5173
```

## 📱 Features

### User Features
- **Registration/Login**: Email or Google OAuth
- **Diamond Packages**: Browse and select diamond packages
- **Order Placement**: Enter Player ID and Server ID
- **WhatsApp Integration**: Automatic redirect to WhatsApp for payment
- **Order Tracking**: Real-time order status updates
- **User Dashboard**: View order history and profile

### Admin Features
- **Hidden Admin Panel**: Access via `/superadmin-9d2f1b6d`
- **Order Management**: Update order status and add notes
- **User Management**: View and manage users
- **Package Management**: CRUD operations for diamond packages
- **Analytics**: Sales and user statistics

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `client/dist`
4. Add environment variables

### Backend (Azure App Service)
1. Create Azure App Service
2. Deploy using GitHub Actions or Azure CLI
3. Set environment variables in Application Settings
4. Configure custom domains if needed

### Database (Azure SQL)
1. Create Azure SQL Database
2. Configure firewall rules
3. Run initialization scripts
4. Set up connection string

## 🔒 Security Features

- **Rate Limiting**: Prevents spam and abuse
- **CSRF Protection**: Cross-site request forgery protection
- **Secure Sessions**: HTTPOnly and secure cookies
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **Password Hashing**: bcrypt for password security

## 📞 Support

For support and questions:
- WhatsApp: +91 9362584929
- Email: Contact through the application

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🔄 Updates and Maintenance

- Regular security updates
- Feature enhancements
- Bug fixes
- Performance optimizations

---

Built with ❤️ for Mobile Legends players by P&K Store
"""

# Write deployment files
with open(f"{base_dir}/Dockerfile", "w") as f:
    f.write(dockerfile)

with open(f"{base_dir}/docker-compose.yml", "w") as f:
    f.write(docker_compose_yml)

with open(f"{base_dir}/vercel.json", "w") as f:
    f.write(vercel_json)

with open(f"{base_dir}/README.md", "w") as f:
    f.write(readme_md)

print("Deployment files and documentation created!")