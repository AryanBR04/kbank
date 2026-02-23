import pool from '../../lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Fetch transactions where user is sender or receiver
        // Join with bankuser to get names
        const [rows] = await pool.query(`
            SELECT 
                t.*,
                s.cname as sender_name,
                r.cname as receiver_name
            FROM transactions t
            LEFT JOIN bankuser s ON t.sender_cid = s.cid
            JOIN bankuser r ON t.receiver_cid = r.cid
            WHERE t.sender_cid = ? OR t.receiver_cid = ?
            ORDER BY t.created_at DESC
        `, [decoded.cid, decoded.cid]);

        // Map transactions to highlight if it's credit or debit for the user
        const transactions = rows.map(tx => ({
            ...tx,
            type: tx.sender_cid === decoded.cid ? 'debit' : 'credit'
        }));

        res.status(200).json(transactions);

    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch transaction records' });
    }
}
