const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
console.log('Reading .env.local from:', envPath);

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('Read .env.local success');

    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });

    console.log('Parsed Env:', { ...env, DB_PASSWORD: '***' });

    async function test() {
        console.log('Attempting connection...');
        try {
            const connection = await mysql.createConnection({
                host: env.DB_HOST,
                user: env.DB_USER,
                password: env.DB_PASSWORD,
                database: env.DB_NAME,
                port: env.DB_PORT,
                ssl: {
                    rejectUnauthorized: false
                }
            });
            console.log('Connected successfully!');
            await connection.end();
        } catch (err) {
            console.error('Connection failed:', err);
        }
    }

    test();

} catch (err) {
    console.error('Error reading env or setup:', err);
}
