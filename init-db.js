const { query } = require('./database');
const logger = require('./logger');

async function initializeDatabase() {
  try {
    logger.info('Starting database initialization...');

    // Create users table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        timezone VARCHAR(50) DEFAULT 'UTC',
        role VARCHAR(20) DEFAULT 'user',
        settings JSONB DEFAULT '{}',
        last_login TIMESTAMP WITH TIME ZONE,
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create projects table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        color VARCHAR(7),
        icon VARCHAR(50),
        due_date TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create tasks table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'todo',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        estimated_duration INTEGER,
        actual_duration INTEGER,
        tags TEXT[] DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create meetings table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        source VARCHAR(50),
        source_id VARCHAR(255),
        transcript TEXT,
        summary TEXT,
        action_items JSONB DEFAULT '[]',
        participants TEXT[] DEFAULT '{}',
        location TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create notifications table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        read BOOLEAN DEFAULT FALSE,
        action_url TEXT,
        metadata JSONB DEFAULT '{}',
        scheduled_for TIMESTAMP WITH TIME ZONE,
        sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create ai_processing_queue table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS ai_processing_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        input_data JSONB NOT NULL,
        output_data JSONB,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create user_preferences table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        notification_settings JSONB DEFAULT '{
          "email": true,
          "push": true,
          "sms": false,
          "dailyDigest": true,
          "quietHours": {"enabled": false, "start": "22:00", "end": "08:00"}
        }',
        ai_preferences JSONB DEFAULT '{
          "autoExtractTasks": true,
          "autoSchedule": true,
          "smartPrioritization": true,
          "language": "en"
        }',
        theme VARCHAR(20) DEFAULT 'light',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;
      CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
      CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
      CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON ai_processing_queue(status);
      CREATE INDEX IF NOT EXISTS idx_ai_queue_user_id ON ai_processing_queue(user_id);
    `);

    // Create function to update updated_at timestamp
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    const tables = ['users', 'projects', 'tasks', 'meetings', 'user_preferences'];
    for (const table of tables) {
      await query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    logger.info('Database initialization completed successfully');
    
    // Create default admin user if not exists
    const adminExists = await query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@omnimind.com']
    );
    
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await query(
        `INSERT INTO users (email, name, password_hash, role, email_verified)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin@omnimind.com', 'Admin User', passwordHash, 'admin', true]
      );
      
      logger.info('Default admin user created');
    }

  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

// Run initialization if this script is called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialized successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;