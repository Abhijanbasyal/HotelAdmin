/* eslint-disable @typescript-eslint/no-namespace */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
