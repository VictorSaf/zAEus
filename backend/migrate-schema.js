require('dotenv').config();
const db = require('./config/database-sqlite');

async function migrateSchema() {
  try {
    console.log('Adding level column to users table...');
    
    // Add level column with default value
    await db.query(`ALTER TABLE users ADD COLUMN level TEXT DEFAULT 'beginner'`);
    console.log('Level column added successfully');
    
    // Verify the change
    const result = await db.query("PRAGMA table_info(users)");
    console.log('Updated users table columns:', result.rows);
    
    // Update admin user to have a level
    await db.query('UPDATE users SET level = ? WHERE username = ?', ['advanced', 'Victor']);
    console.log('Admin user level updated to advanced');
    
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('Level column already exists');
    } else {
      console.error('Migration error:', error.message);
    }
  }
}

migrateSchema();