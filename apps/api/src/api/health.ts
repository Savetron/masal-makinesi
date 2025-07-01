import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateGeminiConfig } from '../lib/gemini.js';
import { validateSupabaseConfig } from '../lib/supabase.js';

/**
 * Health Check API Endpoint
 * GET /api/health
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const checks = {
            gemini: validateGeminiConfig(),
            supabase: validateSupabaseConfig(),
            timestamp: new Date().toISOString(),
        };

        const allHealthy = Object.values(checks).every(check => 
            typeof check === 'boolean' ? check : true
        );

        return res.status(allHealthy ? 200 : 503).json({
            success: allHealthy,
            checks,
            status: allHealthy ? 'healthy' : 'degraded',
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
} 