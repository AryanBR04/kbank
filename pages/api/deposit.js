import pool from '../../lib/db';
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

    const { amount, pin, description } = req.body;

    if (!amount || !pin) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
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

        // Fetch User & Verify PIN
        const [userRows] = await connection.query('SELECT cid, balance, pin FROM bankuser WHERE cid = ?', [decoded.cid]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }
        const user = userRows[0];

        const isPinMatch = await bcrypt.compare(pin, user.pin);
        if (!isPinMatch) {
            return res.status(403).json({ message: 'Incorrect security PIN' });
        }

        // Execute Deposit
        await connection.beginTransaction();

        try {
            // Update balance
            await connection.query('UPDATE bankuser SET balance = balance + ? WHERE cid = ?', [depositAmount, user.cid]);

            // Log transaction
            const txDesc = description || 'Private Deposit';
            await connection.query(
                'INSERT INTO transactions (sender_cid, receiver_cid, amount, description) VALUES (?, ?, ?, ?)',
                [null, user.cid, depositAmount, txDesc]
            );

            await connection.commit();
            res.status(200).json({ message: 'Deposit successful', amount: depositAmount });

        } catch (txError) {
            await connection.rollback();
            throw txError;
        }

    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({ message: 'System error during deposit' });
    } finally {
        if (connection) connection.release();
    }
}
