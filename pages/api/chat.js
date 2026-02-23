import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        // Verify JWT signature
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        try {
            jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({ message: 'Invalid session' });
        }

        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        console.log(`[ChatProxy] Forwarding message to NeuraChat: "${message.substring(0, 50)}..."`);

        const response = await fetch(process.env.NEURACHAT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEURACHAT_API_KEY}`
            },
            body: JSON.stringify({
                model: process.env.NEURACHAT_MODEL || "meta-llama/Llama-3.2-1B-Instruct",
                messages: [
                    { role: "system", content: "You are NeuraChat, a helpful AI banking assistant for kbank. Be professional, friendly, and concise." },
                    { role: "user", content: message }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ChatProxy] NeuraChat API error (${response.status}):`, errorText);
            return res.status(response.status).json({ message: 'Chat service temporarily unavailable' });
        }

        const data = await response.json();

        // Map Hugging Face (OpenAI format) response to { reply: "..." }
        const reply = data.choices?.[0]?.message?.content || 'No response from AI.';
        return res.status(200).json({ reply });

    } catch (error) {
        console.error('[ChatProxy] Internal error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
