// Profile Management
app.put('/api/user/profile', authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.userId;

    // Validate new email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if email exists
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Update profile
    const updatedUser = await pool.query(
      'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email',
      [email, userId]
    );

    res.json(updatedUser.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Password Reset Request
app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (user.rows.length === 0) {
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.rows[0].id, resetToken, expiresAt]
    );

    // In production: Send email with reset link
    console.log(`Password reset token: ${resetToken}`);
    
    res.json({ message: 'Password reset link sent if email exists' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Password Reset Completion
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find valid token
    const tokenData = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    
    if (tokenData.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, tokenData.rows[0].user_id]
    );

    // Delete used token
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE id = $1',
      [tokenData.rows[0].id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create password_reset_tokens table if not exists
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}
initDB();
