# Generate packages routes
packages_routes_ts = """import express from 'express'
import { pool, sql } from '../config/db'

const router = express.Router()

// Get all packages
router.get('/', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT 
          id,
          label,
          diamonds,
          bonus,
          price,
          old_price,
          is_popular,
          is_active
        FROM Packages 
        WHERE is_active = 1
        ORDER BY price ASC
      `)

    const packages = result.recordset.map(pkg => ({
      id: pkg.id,
      label: pkg.label,
      diamonds: pkg.diamonds,
      bonus: pkg.bonus,
      price: pkg.price,
      oldPrice: pkg.old_price,
      isPopular: pkg.is_popular
    }))

    res.json(packages)
  } catch (error) {
    console.error('Error fetching packages:', error)
    res.status(500).json({ error: 'Failed to fetch packages' })
  }
})

// Get package by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM Packages WHERE id = @id AND is_active = 1')

    const package = result.recordset[0]
    if (!package) {
      return res.status(404).json({ error: 'Package not found' })
    }

    res.json(package)
  } catch (error) {
    console.error('Error fetching package:', error)
    res.status(500).json({ error: 'Failed to fetch package' })
  }
})

export default router"""

# Generate admin routes
admin_routes_ts = """import express from 'express'
import { pool, sql } from '../config/db'
import { isAdmin } from '../middleware/auth'

const router = express.Router()

// Admin authentication middleware
router.use(isAdmin)

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [ordersResult, usersResult, revenueResult] = await Promise.all([
      pool.request().query('SELECT COUNT(*) as total FROM Orders'),
      pool.request().query('SELECT COUNT(*) as total FROM Users'),
      pool.request().query(`
        SELECT 
          SUM(p.price) as total_revenue,
          COUNT(o.id) as completed_orders
        FROM Orders o
        JOIN Packages p ON o.package_id = p.id
        WHERE o.status = 'Completed'
      `)
    ])

    const stats = {
      totalOrders: ordersResult.recordset[0].total,
      totalUsers: usersResult.recordset[0].total,
      totalRevenue: revenueResult.recordset[0].total_revenue || 0,
      completedOrders: revenueResult.recordset[0].completed_orders || 0
    }

    res.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT 
          o.*,
          u.name as user_name,
          u.email as user_email,
          p.label as package_label,
          p.price as package_price
        FROM Orders o
        LEFT JOIN Users u ON o.user_id = u.id
        LEFT JOIN Packages p ON o.package_id = p.id
        ORDER BY o.created_at DESC
      `)

    const orders = result.recordset.map(order => ({
      ...order,
      user: {
        name: order.user_name,
        email: order.user_email
      },
      package: {
        label: order.package_label,
        price: order.package_price
      }
    }))

    res.json(orders)
  } catch (error) {
    console.error('Error fetching admin orders:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// Update order status
router.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    if (!['Pending', 'Processing', 'Completed', 'Failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('status', sql.NVarChar, status)
      .input('notes', sql.NVarChar, notes || '')
      .input('updatedAt', sql.DateTime2, new Date())
      .query(`
        UPDATE Orders 
        SET status = @status, 
            admin_notes = @notes,
            updated_at = @updatedAt
        WHERE id = @id
      `)

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    res.status(500).json({ error: 'Failed to update order' })
  }
})

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT 
          u.*,
          COUNT(o.id) as order_count,
          SUM(CASE WHEN o.status = 'Completed' THEN p.price ELSE 0 END) as total_spent
        FROM Users u
        LEFT JOIN Orders o ON u.id = o.user_id
        LEFT JOIN Packages p ON o.package_id = p.id
        GROUP BY u.id, u.name, u.email, u.avatar, u.created_at, u.google_id, u.password_hash
        ORDER BY u.created_at DESC
      `)

    res.json(result.recordset)
  } catch (error) {
    console.error('Error fetching admin users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Get all packages for admin
router.get('/packages', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT * FROM Packages ORDER BY price ASC')

    res.json(result.recordset)
  } catch (error) {
    console.error('Error fetching admin packages:', error)
    res.status(500).json({ error: 'Failed to fetch packages' })
  }
})

// Create new package
router.post('/packages', async (req, res) => {
  try {
    const { label, diamonds, bonus, price, oldPrice, isPopular } = req.body

    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .input('diamonds', sql.Int, diamonds)
      .input('bonus', sql.Int, bonus)
      .input('price', sql.Decimal(10, 2), price)
      .input('oldPrice', sql.Decimal(10, 2), oldPrice)
      .input('isPopular', sql.Bit, isPopular || false)
      .query(`
        INSERT INTO Packages (label, diamonds, bonus, price, old_price, is_popular, is_active)
        OUTPUT INSERTED.*
        VALUES (@label, @diamonds, @bonus, @price, @oldPrice, @isPopular, 1)
      `)

    res.json(result.recordset[0])
  } catch (error) {
    console.error('Error creating package:', error)
    res.status(500).json({ error: 'Failed to create package' })
  }
})

// Update package
router.put('/packages/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { label, diamonds, bonus, price, oldPrice, isPopular, isActive } = req.body

    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('label', sql.NVarChar, label)
      .input('diamonds', sql.Int, diamonds)
      .input('bonus', sql.Int, bonus)
      .input('price', sql.Decimal(10, 2), price)
      .input('oldPrice', sql.Decimal(10, 2), oldPrice)
      .input('isPopular', sql.Bit, isPopular)
      .input('isActive', sql.Bit, isActive)
      .query(`
        UPDATE Packages 
        SET label = @label,
            diamonds = @diamonds,
            bonus = @bonus,
            price = @price,
            old_price = @oldPrice,
            is_popular = @isPopular,
            is_active = @isActive
        WHERE id = @id
      `)

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating package:', error)
    res.status(500).json({ error: 'Failed to update package' })
  }
})

export default router"""

# Write remaining route files
with open(f"{base_dir}/server/src/routes/packages.ts", "w") as f:
    f.write(packages_routes_ts)

with open(f"{base_dir}/server/src/routes/admin.ts", "w") as f:
    f.write(admin_routes_ts)

print("Packages and Admin routes created!")