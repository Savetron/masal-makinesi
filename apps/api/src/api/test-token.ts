import { VercelRequest, VercelResponse } from '@vercel/node';
import { createTestToken } from '../lib/auth.js';

/**
 * Test Token Generator API Endpoint
 * POST /api/test-token
 * Development only - generates JWT tokens for testing
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ 
            success: false, 
            error: 'Not found' 
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const { userId = 'test-user', email = 'test@example.com' } = req.body || {};

        const token = createTestToken(userId, email);

        return res.status(200).json({
            success: true,
            token,
            userId,
            email,
            expiresIn: '24h',
            note: 'This is a development-only endpoint',
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: 'Token generation failed',
            details: error.message,
        });
    }
} 