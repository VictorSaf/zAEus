require('dotenv').config();
const db = require('./config/database-sqlite');

async function checkSchema() {
  try {
    console.log('Checking users table schema...');
    const result = await db.query("PRAGMA table_info(users)");
    console.log('Users table columns:', result.rows);
    
    console.log('\nChecking if admin user exists...');
    const admin = await db.query('SELECT * FROM users WHERE username = ?', ['Victor']);
    console.log('Admin user:', admin.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();