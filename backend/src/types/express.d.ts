// backend/src/types/express.d.ts
declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      role: string;
    };
  }
}
