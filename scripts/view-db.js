const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');

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

            console.log('\n--- Table: bankuser ---');
            const [users] = await connection.execute('SELECT * FROM bankuser');
            console.table(users);

            console.log('\n--- Table: bankuser_jwt ---');
            const [tokens] = await connection.execute('SELECT * FROM bankuser_jwt');
            console.table(tokens.map(t => ({ ...t, tokenvalue: t.tokenvalue.substring(0, 20) + '...' }))); // Truncate token for readability

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
