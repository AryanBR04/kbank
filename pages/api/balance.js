import pool from '../../lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        // Verify JWT signature
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({ message: 'Invalid token signature' });
        }

        // Verify token exists in DB and is valid
        const [rows] = await pool.query(
            'SELECT * FROM bankuser_jwt WHERE tokenvalue = ? AND cid = ?',
            [token, decoded.cid]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Session expired or invalid' });
        }

        // Fetch user details
        const [userRows] = await pool.query('SELECT balance, cname, pin FROM bankuser WHERE cid = ?', [decoded.cid]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userRows[0];

        // GET Request: Return Name only (Balance hidden)
        if (req.method === 'GET') {
            return res.status(200).json({ cname: user.cname, cid: decoded.cid }); // Return cid for chat isolation
        }

        // POST Request: Verify PIN and return Balance
        if (req.method === 'POST') {
            const { pin } = req.body;
            if (!pin) {
                return res.status(400).json({ message: 'PIN required' });
            }

            const isMatch = await bcrypt.compare(pin, user.pin);
            if (!isMatch) {
                return res.status(403).json({ message: 'Incorrect PIN' });
            }

            return res.status(200).json({ balance: user.balance });
        }

        return res.status(405).json({ message: 'Method not allowed' });

    } catch (error) {
        console.error('Balance check error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
