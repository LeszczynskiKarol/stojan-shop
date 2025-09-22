// backend/src/middlewares/session.middleware.ts
import session from 'express-session';

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'tajny_klucz',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 60 * 1000, // 30 minut
  },
});
