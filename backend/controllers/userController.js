const bcrypt = require('bcrypt');
const db = require('../config/database-sqlite');

async function getAllUsers(req, res) {
  try {
    const result = await db.query(
      'SELECT id, username, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    const users = result.rows.map(user => ({
      ...user,
      fullName: user.full_name,
      isActive: user.is_active === 1
    }));
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createUser(req, res) {
  try {
    const { username, email, password, fullName, role = 'user' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (username, email, password, full_name, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, fullName, role]
    );

    const result = await db.query(
      'SELECT id, username, email, full_name, role, is_active FROM users WHERE username = ? AND email = ?',
      [username, email]
    );

    const user = result.rows[0];
    res.status(201).json({
      ...user,
      fullName: user.full_name,
      isActive: user.is_active === 1
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, email, fullName, role, isActive } = req.body;

    await db.query(
      `UPDATE users 
       SET username = ?, email = ?, full_name = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [username, email, fullName, role, isActive ? 1 : 0, id]
    );

    const result = await db.query(
      'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      ...user,
      fullName: user.full_name,
      isActive: user.is_active === 1
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getAllUsers, createUser, updateUser, deleteUser };