import { describe, it, expect } from 'vitest';
import { isAdmin, buildProfileWhere, canManage, memberIdFromBody } from '../../src/utils/memberScope';

const adminReq = (over = {}) => ({ user: { id: 'a-1', role: 'ADMIN' }, query: {}, body: {}, ...over });
const userReq = (over = {}) => ({ user: { id: 'u-1', role: 'USER' }, query: {}, body: {}, ...over });

describe('memberScope', () => {
  it('isAdmin solo para rol ADMIN', () => {
    expect(isAdmin(adminReq())).toBe(true);
    expect(isAdmin(userReq())).toBe(false);
  });

  it('buildProfileWhere: admin con memberId filtra por memberId', () => {
    const req = adminReq({ query: { memberId: 'm-1' } });
    expect(buildProfileWhere(req, { deletedAt: null })).toEqual({ deletedAt: null, memberId: 'm-1' });
  });

  it('buildProfileWhere: usuario normal siempre filtra por su userId', () => {
    const req = userReq({ query: { memberId: 'm-1' } });
    expect(buildProfileWhere(req)).toEqual({ userId: 'u-1' });
  });

  it('canManage: propietario, o admin sobre entidad con memberId', () => {
    expect(canManage(userReq(), { userId: 'u-1' })).toBe(true);
    expect(canManage(userReq(), { userId: 'otro' })).toBe(false);
    expect(canManage(adminReq(), { userId: 'otro', memberId: 'm-1' })).toBe(true);
    expect(canManage(adminReq(), { userId: 'otro' })).toBe(false);
    expect(canManage(userReq(), null)).toBe(false);
  });

  it('memberIdFromBody: solo admin aporta memberId del body', () => {
    expect(memberIdFromBody(adminReq({ body: { memberId: 'm-1' } }))).toBe('m-1');
    expect(memberIdFromBody(adminReq({ body: {} }))).toBeNull();
    expect(memberIdFromBody(userReq({ body: { memberId: 'm-1' } }))).toBeUndefined();
  });
});
