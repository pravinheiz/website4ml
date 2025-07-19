# Generate database configuration
db_config_ts = """import sql from 'mssql'
import dotenv from 'dotenv'

dotenv.config()

const config: sql.config = {
  user: process.env.AZURE_SQL_USER!,
  password: process.env.AZURE_SQL_PWD!,
  server: process.env.AZURE_SQL_SERVER!,
  database: process.env.AZURE_SQL_DB!,
  options: {
    encrypt: true, // Use encryption for Azure SQL
    enableArithAbort: true,
    trustServerCertificate: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
}

export const pool = new sql.ConnectionPool(config)

// Initialize connection
pool.connect().then(() => {
  console.log('✅ Connected to Azure SQL Database')
}).catch(err => {
  console.error('❌ Database connection failed:', err)
})

export { sql }"""

# Generate Passport configuration
passport_config_ts = """import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as LocalStrategy } from 'passport-local'
import bcrypt from 'bcryptjs'
import { pool, sql } from './db'

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value
    const name = profile.displayName
    const googleId = profile.id
    const avatar = profile.photos?.[0]?.value

    // Check if user exists
    const result = await pool.request()
      .input('googleId', sql.NVarChar, googleId)
      .query('SELECT * FROM Users WHERE google_id = @googleId')

    let user = result.recordset[0]

    if (!user) {
      // Create new user
      const insertResult = await pool.request()
        .input('googleId', sql.NVarChar, googleId)
        .input('name', sql.NVarChar, name)
        .input('email', sql.NVarChar, email)
        .input('avatar', sql.NVarChar, avatar)
        .query(`
          INSERT INTO Users (google_id, name, email, avatar) 
          OUTPUT INSERTED.*
          VALUES (@googleId, @name, @email, @avatar)
        `)
      user = insertResult.recordset[0]
    }

    return done(null, user)
  } catch (error) {
    console.error('Google OAuth error:', error)
    return done(error, null)
  }
}))

// Local Strategy for email/password
passport.use(new LocalStrategy({
  usernameField: 'email'
}, async (email, password, done) => {
  try {
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email AND password_hash IS NOT NULL')

    const user = result.recordset[0]

    if (!user || !user.password_hash) {
      return done(null, false, { message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return done(null, false, { message: 'Invalid credentials' })
    }

    return done(null, user)
  } catch (error) {
    console.error('Local auth error:', error)
    return done(error)
  }
}))

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT id, name, email, avatar, created_at FROM Users WHERE id = @id')

    const user = result.recordset[0]
    done(null, user)
  } catch (error) {
    console.error('Deserialize user error:', error)
    done(error, null)
  }
})

export default passport"""

# Write config files
with open(f"{base_dir}/server/src/config/db.ts", "w") as f:
    f.write(db_config_ts)

with open(f"{base_dir}/server/src/config/passport.ts", "w") as f:
    f.write(passport_config_ts)

print("Database and Passport configuration created!")