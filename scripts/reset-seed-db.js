const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // Make sure to use bcryptjs as installed

const envPath = path.join(__dirname, '../.env.local');

// 3 Test Users Data
const users = [
    { cname: 'Alice User', email: 'alice@test.com', password: 'password123', pin: '123456', balance: 5000.00 },
    { cname: 'Bob Banker', email: 'bob@test.com', password: 'password123', pin: '654321', balance: 2500.50 },
    { cname: 'Charlie Client', email: 'charlie@test.com', password: 'password123', pin: '112233', balance: 10000.00 }
];

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
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
                ssl: { rejectUnauthorized: false }
            });

            console.log('Connected! Resetting tables...');

            // 1. Drop existing tables
            await connection.execute('DROP TABLE IF EXISTS transactions');
            await connection.execute('DROP TABLE IF EXISTS bankuser_jwt');
            await connection.execute('DROP TABLE IF EXISTS bankuser');
            console.log('Dropped old tables.');

            // 2. Create bankuser table WITH PIN
            await connection.execute(`
        CREATE TABLE bankuser (
          cid INT AUTO_INCREMENT PRIMARY KEY,
          cname VARCHAR(255) NOT NULL,
          cpwd VARCHAR(255) NOT NULL,
          pin VARCHAR(255) NOT NULL,
          balance DECIMAL(15, 2) DEFAULT 0.00,
          email VARCHAR(255) NOT NULL UNIQUE
        )
      `);
            console.log('Created bankuser table (with PIN).');

            // 3. Create transactions table
            await connection.execute(`
        CREATE TABLE transactions (
          tid INT AUTO_INCREMENT PRIMARY KEY,
          sender_cid INT,
          receiver_cid INT NOT NULL,
          amount DECIMAL(15, 2) NOT NULL,
          description VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_cid) REFERENCES bankuser(cid),
          FOREIGN KEY (receiver_cid) REFERENCES bankuser(cid)
        )
      `);
            console.log('Created transactions table.');

            // 4. Create bankuser_jwt table
            await connection.execute(`
        CREATE TABLE bankuser_jwt (
          tokenid INT AUTO_INCREMENT PRIMARY KEY,
          tokenvalue TEXT NOT NULL,
          cid INT NOT NULL,
          exp DATETIME NOT NULL,
          FOREIGN KEY (cid) REFERENCES bankuser(cid) ON DELETE CASCADE
        )
      `);
            console.log('Created bankuser_jwt table.');

            // 4. Seed Users
            console.log('Seeding users...');
            for (const u of users) {
                const hashedPwd = await bcrypt.hash(u.password, 10);
                const hashedPin = await bcrypt.hash(u.pin, 10);

                await connection.execute(
                    'INSERT INTO bankuser (cname, email, cpwd, pin, balance) VALUES (?, ?, ?, ?, ?)',
                    [u.cname, u.email, hashedPwd, hashedPin, u.balance]
                );
                console.log(`User ${u.cname} added.`);
            }

            console.log('\n--- Credentials for Testing ---');
            users.forEach(u => {
                console.log(`Email: ${u.email} | Pass: ${u.password} | PIN: ${u.pin}`);
            });
            console.log('-------------------------------');

        } catch (err) {
            console.error('Error:', err);
        } finally {
            if (connection) await connection.end();
        }
    }

    main();

} catch (err) {
    console.error('Error reading env:', err);
}
