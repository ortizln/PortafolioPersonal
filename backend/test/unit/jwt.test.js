import { describe, it, expect, beforeAll } from 'vitest';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../src/auth/jwt';

process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

describe('jwt helpers', () => {
  const user = { id: 'u-1', role: 'ADMIN' };

  beforeAll(() => {
    const mod = require('../../src/auth/jwt');
    return mod;
  });

  it('genera y verifica access token con id y rol', () => {
    const token = generateAccessToken(user);
    const payload = verifyAccessToken(token);
    expect(payload.id).toBe('u-1');
    expect(payload.role).toBe('ADMIN');
    expect(payload).not.toHaveProperty('password');
  });

  it('genera y verifica refresh token', () => {
    const token = generateRefreshToken(user);
    const payload = verifyRefreshToken(token);
    expect(payload.id).toBe('u-1');
  });

  it('rechaza un token firmado con la clave incorrecta', () => {
    const token = require('jsonwebtoken').sign({ id: 'x', role: 'USER' }, 'otra-clave');
    expect(() => verifyAccessToken(token)).toThrow();
  });
});
