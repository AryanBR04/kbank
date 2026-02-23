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

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Valid current and new password required' });
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

        // 1. Verify Current Password
        const [rows] = await connection.query('SELECT cpwd FROM bankuser WHERE cid = ?', [decoded.cid]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, rows[0].cpwd);
        if (!isMatch) {
            return res.status(403).json({ message: 'Current password is incorrect' });
        }

        // 2. Hash and Update New Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await connection.query('UPDATE bankuser SET cpwd = ? WHERE cid = ?', [hashedPassword, decoded.cid]);

        res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('Update Password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
}
