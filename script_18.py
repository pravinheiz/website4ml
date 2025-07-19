# Generate authentication routes
auth_routes_ts = """import express from 'express'
import passport from 'passport'
import bcrypt from 'bcryptjs'
import { pool, sql } from '../config/db'

const router = express.Router()

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}))

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173/dashboard')
  }
)

// Local authentication
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication error' })
    }
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Invalid credentials' })
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login error' })
      }
      return res.json({ 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      })
    })
  })(req, res, next)
})

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check if user exists
    const existingUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM Users WHERE email = @email')

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, hashedPassword)
      .query(`
        INSERT INTO Users (name, email, password_hash)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.created_at
        VALUES (@name, @email, @passwordHash)
      `)

    const user = result.recordset[0]
    
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login error after registration' })
      }
      return res.json({ user })
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Get current user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user })
  } else {
    res.status(401).json({ error: 'Not authenticated' })
  }
})

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout error' })
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destroy error' })
      }
      res.clearCookie('connect.sid')
      res.json({ message: 'Logged out successfully' })
    })
  })
})

export default router"""

# Generate orders routes
orders_routes_ts = """import express from 'express'
import { pool, sql } from '../config/db'
import { isAuthenticated } from '../middleware/auth'

const router = express.Router()

// Get user's orders
router.get('/user', isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).id

    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT 
          o.*,
          p.label as package_label,
          p.diamonds,
          p.bonus,
          p.price as package_price
        FROM Orders o
        LEFT JOIN Packages p ON o.package_id = p.id
        WHERE o.user_id = @userId
        ORDER BY o.created_at DESC
      `)

    const orders = result.recordset.map(order => ({
      ...order,
      package: {
        label: order.package_label,
        diamonds: order.diamonds,
        bonus: order.bonus,
        price: order.package_price
      }
    }))

    res.json(orders)
  } catch (error) {
    console.error('Error fetching user orders:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// Create new order
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { playerId, serverId, packageId, paymentMethod } = req.body
    const userId = (req.user as any).id

    // Validate input
    if (!playerId || !serverId || !packageId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get package details
    const packageResult = await pool.request()
      .input('packageId', sql.Int, packageId)
      .query('SELECT * FROM Packages WHERE id = @packageId')

    const package = packageResult.recordset[0]
    if (!package) {
      return res.status(404).json({ error: 'Package not found' })
    }

    // Create order
    const orderResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('playerId', sql.Int, parseInt(playerId))
      .input('serverId', sql.Int, parseInt(serverId))
      .input('packageId', sql.Int, packageId)
      .input('paymentMethod', sql.NVarChar, paymentMethod)
      .query(`
        INSERT INTO Orders (user_id, player_id, server_id, package_id, payment_method, status)
        OUTPUT INSERTED.*
        VALUES (@userId, @playerId, @serverId, @packageId, @paymentMethod, 'Pending')
      `)

    const order = orderResult.recordset[0]

    // Create WhatsApp message
    const orderText = `New Order #${order.id}\\n\\nPlayer ID: ${playerId}\\nServer ID: ${serverId}\\nPackage: ${package.label}\\nPrice: ₹${package.price}\\nPayment Method: ${paymentMethod}\\n\\nPlease process this order.`
    const whatsappUrl = `https://wa.me/${process.env.WHATSAPP_NUM}?text=${encodeURIComponent(orderText)}`

    res.json({
      success: true,
      order: {
        ...order,
        package
      },
      whatsappUrl
    })

  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

export default router"""

# Write route files
with open(f"{base_dir}/server/src/routes/auth.ts", "w") as f:
    f.write(auth_routes_ts)

with open(f"{base_dir}/server/src/routes/orders.ts", "w") as f:
    f.write(orders_routes_ts)

print("Authentication and Orders routes created!")