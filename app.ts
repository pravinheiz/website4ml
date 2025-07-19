import express from 'express'
import session from 'express-session'
import passport from 'passport'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'

// Import configurations
import './config/passport'
import { pool } from './config/db'

// Import routes
import authRoutes from './routes/auth'
import orderRoutes from './routes/orders'
import packageRoutes from './routes/packages'
import adminRoutes from './routes/admin'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/packages', packageRoutes)
app.use(`/api/${process.env.ADMIN_SECRET_PATH}`, adminRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 Admin panel: /api/${process.env.ADMIN_SECRET_PATH}`)
})

export default app