const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
    user: 'postgres',
    host: '149.50.148.105',
    database: 'alohomora',
    password: 'Fideo2022',
    port: 5432
});

async function initDatabase() {
    const client = await pool.connect();
    try {
        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Initializing database schema...');
        
        await client.query('BEGIN');
        
        // Split the schema into individual statements
        const statements = schema.split(';').filter(statement => statement.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                    console.log('Executed statement successfully');
                } catch (error) {
                    console.error('Error executing statement:', error.message);
                    throw error;
                }
            }
        }
        
        await client.query('COMMIT');
        
        // Verify tables were created
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'fleet'
        `);
        
        console.log('Tables in fleet schema:', result.rows);
        console.log('Database schema initialized successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        client.release();
        pool.end();
    }
}

initDatabase().catch(console.error); 