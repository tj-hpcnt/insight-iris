import { AuthenticatedUser } from '../auth/auth.service';

declare module 'express-session' {
  interface SessionData {
    user?: AuthenticatedUser;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
} 