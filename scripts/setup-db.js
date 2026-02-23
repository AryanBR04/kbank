const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
console.log('Reading .env.local from:', envPath);

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split(/\r?\n/).forEach(line => {
        const index = line.indexOf('=');
        if (index !== -1) {
            const key = line.substring(0, index).trim();
            const value = line.substring(index + 1).trim();
            if (key) env[key] = value;
        }
    });

    async function main() {
        console.log('Connecting to database...');
        let connection;
        try {
            connection = await mysql.createConnection({
                host: env.DB_HOST,
                user: env.DB_USER,
                password: env.DB_PASSWORD,
                database: env.DB_NAME,
                port: env.DB_PORT,
                ssl: {
                    rejectUnauthorized: false
                }
            });
            console.log('Connected!');

            // 1. Create bankuser table
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS bankuser (
          cid INT AUTO_INCREMENT PRIMARY KEY,
          cname VARCHAR(255) NOT NULL,
          cpwd VARCHAR(255) NOT NULL,
          pin VARCHAR(255) NOT NULL,
          balance DECIMAL(15, 2) DEFAULT 0.00,
          email VARCHAR(255) NOT NULL UNIQUE
        )
      `);
            console.log('Table bankuser created or already exists.');

            // 2. Create bankuser_jwt table
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS bankuser_jwt (
          tokenid INT AUTO_INCREMENT PRIMARY KEY,
          tokenvalue TEXT NOT NULL,
          cid INT NOT NULL,
          exp DATETIME NOT NULL,
          FOREIGN KEY (cid) REFERENCES bankuser(cid) ON DELETE CASCADE
        )
      `);
            console.log('Table bankuser_jwt created or already exists.');

        } catch (err) {
            console.error('Error creating tables:', err);
        } finally {
            if (connection) await connection.end();
        }
    }

    main();

} catch (err) {
    console.error('Error reading env:', err);
}
