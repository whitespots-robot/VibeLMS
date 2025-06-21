import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface SessionPayload {
  sessionId: string;
  userId?: number;
  username?: string;
  role?: string;
  isAnonymous: boolean;
  createdAt: number;
}

export interface AuthenticatedRequest extends Request {
  session?: SessionPayload;
  user?: any;
}

// Generate anonymous session
export function generateAnonymousSession(): SessionPayload {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  
  return {
    sessionId: `anon_${timestamp}_${randomId}`,
    isAnonymous: true,
    createdAt: timestamp
  };
}

// Generate authenticated session
export function generateAuthenticatedSession(user: any): SessionPayload {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  
  return {
    sessionId: `auth_${timestamp}_${randomId}`,
    userId: user.id,
    username: user.username,
    role: user.role,
    isAnonymous: false,
    createdAt: timestamp
  };
}

// Create JWT token
export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch (error) {
    return null;
  }
}

// Middleware to ensure session exists (anonymous or authenticated)
export function ensureSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.session;
  
  if (!token) {
    // Create new anonymous session
    const anonymousSession = generateAnonymousSession();
    const newToken = createToken(anonymousSession);
    
    res.cookie('session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    req.session = anonymousSession;
    return next();
  }
  
  // Verify existing token
  const session = verifyToken(token);
  if (!session) {
    // Invalid token, create new anonymous session
    const anonymousSession = generateAnonymousSession();
    const newToken = createToken(anonymousSession);
    
    res.cookie('session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    req.session = anonymousSession;
    return next();
  }
  
  req.session = session;
  
  // If authenticated session, fetch user data
  if (!session.isAnonymous && session.userId) {
    storage.getUser(session.userId).then(user => {
      req.user = user;
      next();
    }).catch(() => {
      // User not found, convert to anonymous session
      const anonymousSession = generateAnonymousSession();
      const newToken = createToken(anonymousSession);
      
      res.cookie('session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      req.session = anonymousSession;
      next();
    });
  } else {
    next();
  }
}

// Middleware to require authentication
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session || req.session.isAnonymous) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  next();
}

// Middleware to require specific role
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.session || req.session.isAnonymous || req.session.role !== role) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Upgrade anonymous session to authenticated session
export function upgradeSession(req: AuthenticatedRequest, res: Response, user: any) {
  const authenticatedSession = generateAuthenticatedSession(user);
  const newToken = createToken(authenticatedSession);
  
  res.cookie('session', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  req.session = authenticatedSession;
  req.user = user;
}

// Clear session (logout)
export function clearSession(req: AuthenticatedRequest, res: Response) {
  res.clearCookie('session');
  req.session = undefined;
  req.user = undefined;
}