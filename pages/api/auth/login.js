import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM bankuser WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'No account associated with this identity was found.' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.cpwd);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const token = jwt.sign({ cid: user.cid, email: user.email }, secret, { expiresIn: '1h' });

        // Store token in DB
        const expDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        // format datetime for mysql: YYYY-MM-DD HH:MM:SS
        const expString = expDate.toISOString().slice(0, 19).replace('T', ' ');

        await pool.query(
            'INSERT INTO bankuser_jwt (tokenvalue, cid, exp) VALUES (?, ?, ?)',
            [token, user.cid, expString]
        );

        // Set Cookie
        console.log('Setting cookie for user:', user.email);
        const serialized = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600,
            path: '/'
        });

        res.setHeader('Set-Cookie', serialized);
        res.status(200).json({ message: 'Login successful', balance: user.balance, cname: user.cname });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
