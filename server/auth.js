import jwt from 'jsonwebtoken';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'super-secret-admin';
const GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'super-secret-guest';

export const signAdminToken = () =>
  jwt.sign(
    {
      role: 'admin',
    },
    ADMIN_JWT_SECRET,
    { expiresIn: process.env.ADMIN_TOKEN_TTL || '12h' },
  );

export const verifyAdminToken = (token) => jwt.verify(token, ADMIN_JWT_SECRET);

export const signGuestToken = (eventId) =>
  jwt.sign(
    {
      role: 'guest',
      eventId,
    },
    GUEST_JWT_SECRET,
    { expiresIn: process.env.GUEST_TOKEN_TTL || '7d' },
  );

export const verifyGuestToken = (token) => jwt.verify(token, GUEST_JWT_SECRET);

export const extractBearerToken = (authorizationHeader = '') => {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return null;
  }
  return authorizationHeader.slice('Bearer '.length).trim();
};
