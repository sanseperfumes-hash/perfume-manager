import { NextRequest } from 'next/server';
// Auth helper
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface DecodedUser {
    userId: string;
    username: string;
    role: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'SIN_ACCESO_FRONTEND';
}

export async function getUserFromRequest(req: NextRequest): Promise<DecodedUser | null> {
    try {
        let token = req.headers.get('Authorization')?.split(' ')[1];

        if (!token) {
            const cookieStore = await cookies();
            token = cookieStore.get('token')?.value;
        }

        if (!token) {
            console.log('[Auth] No token found in header or cookies');
            return null;
        }

        const decoded = verify(token, JWT_SECRET) as any;

        if (!decoded.userId || !decoded.role) {
            console.log('[Auth] Invalid token structure');
            return null;
        }

        return {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };
    } catch (error) {
        console.error('[Auth] Error verifying token:', error);
        return null;
    }
}
