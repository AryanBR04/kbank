import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin || newPin.length !== 6) {
        return res.status(400).json({ message: 'Current and valid new PIN (6 digits) required' });
    }

    let connection;
    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        connection = await pool.getConnection();

        // 1. Verify Current PIN
        const [rows] = await connection.query('SELECT pin FROM bankuser WHERE cid = ?', [decoded.cid]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPin, rows[0].pin);
        if (!isMatch) {
            return res.status(403).json({ message: 'Current PIN is incorrect' });
        }

        // 2. Hash and Update New PIN
        const hashedPin = await bcrypt.hash(newPin, 10);
        await connection.query('UPDATE bankuser SET pin = ? WHERE cid = ?', [hashedPin, decoded.cid]);

        res.status(200).json({ message: 'Security PIN updated successfully' });

    } catch (error) {
        console.error('Update PIN error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
}
