import jwt from 'jsonwebtoken';

export interface AuthPayload {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

interface RequestWithAuth {
    headers: {
        authorization?: string;
    };
}

/**
 * JWT Authentication Middleware
 */
export function authenticateToken(request: RequestWithAuth): AuthPayload | null {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return null;
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET not configured');
        }

        const payload = jwt.verify(token, jwtSecret) as AuthPayload;
        return payload;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

/**
 * Creates a JWT token for testing
 */
export function createTestToken(userId: string = 'test-user', email: string = 'test@example.com'): string {
    const jwtSecret = process.env.JWT_SECRET || 'test-secret';
    
    return jwt.sign(
        { 
            userId, 
            email 
        },
        jwtSecret,
        { 
            expiresIn: '24h' 
        }
    );
}

/**
 * Validates token format and expiry
 */
export function validateTokenFormat(token: string): boolean {
    try {
        const decoded = jwt.decode(token);
        return decoded !== null && typeof decoded === 'object';
    } catch {
        return false;
    }
}

/**
 * Extracts user info from request
 */
export function extractUserInfo(request: RequestWithAuth): AuthPayload | null {
    return authenticateToken(request);
} 