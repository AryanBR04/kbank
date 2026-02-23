import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { cname, email, password, pin } = req.body;

    if (!cname || !email || !password || !pin) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (pin.length !== 6 || isNaN(pin)) {
        return res.status(400).json({ message: 'PIN must be 6 digits' });
    }

    try {
        // Check if user already exists
        const [rows] = await pool.query('SELECT cid FROM bankuser WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Hash password and PIN
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPin = await bcrypt.hash(pin, 10);
        const initialBalance = 1000.00; // Default balance

        // Insert user
        const [result] = await pool.query(
            'INSERT INTO bankuser (cname, email, cpwd, pin, balance) VALUES (?, ?, ?, ?, ?)',
            [cname, email, hashedPassword, hashedPin, initialBalance]
        );

        res.status(201).json({ message: 'User created successfully', cid: result.insertId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
