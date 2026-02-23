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

    const { recipientEmail, amount, pin, description } = req.body;

    if (!recipientEmail || !amount || !pin) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    let connection;
    try {
        // 1. Authenticate Sender
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        connection = await pool.getConnection();

        // Check session in DB
        const [sessionRows] = await connection.query(
            'SELECT * FROM bankuser_jwt WHERE tokenvalue = ? AND cid = ?',
            [token, decoded.cid]
        );
        if (sessionRows.length === 0) {
            return res.status(401).json({ message: 'Session expired' });
        }

        // 2. Fetch Sender & Verify PIN
        const [senderRows] = await connection.query('SELECT cid, balance, pin, cname FROM bankuser WHERE cid = ?', [decoded.cid]);
        if (senderRows.length === 0) {
            return res.status(404).json({ message: 'Sender not found' });
        }
        const sender = senderRows[0];

        const isPinMatch = await bcrypt.compare(pin, sender.pin);
        if (!isPinMatch) {
            return res.status(403).json({ message: 'Incorrect security PIN' });
        }

        if (sender.balance < transferAmount) {
            return res.status(400).json({ message: 'Insufficient liquidity in vault' });
        }

        // 3. Fetch Recipient
        const [recipientRows] = await connection.query('SELECT cid, cname FROM bankuser WHERE email = ?', [recipientEmail]);
        if (recipientRows.length === 0) {
            return res.status(404).json({ message: 'Recipient account not found' });
        }
        const recipient = recipientRows[0];

        if (sender.cid === recipient.cid) {
            return res.status(400).json({ message: 'Cannot transfer to yourself' });
        }

        // 4. Execute Transaction
        await connection.beginTransaction();

        try {
            // Deduct from sender
            await connection.query('UPDATE bankuser SET balance = balance - ? WHERE cid = ?', [transferAmount, sender.cid]);

            // Add to recipient
            await connection.query('UPDATE bankuser SET balance = balance + ? WHERE cid = ?', [transferAmount, recipient.cid]);

            // Log transaction
            const txDesc = description || `Transfer to ${recipient.cname}`;
            await connection.query(
                'INSERT INTO transactions (sender_cid, receiver_cid, amount, description) VALUES (?, ?, ?, ?)',
                [sender.cid, recipient.cid, transferAmount, txDesc]
            );

            await connection.commit();
            res.status(200).json({ message: 'Transfer successful', amount: transferAmount });

        } catch (txError) {
            await connection.rollback();
            throw txError;
        }

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({ message: 'System error during transfer' });
    } finally {
        if (connection) connection.release();
    }
}
