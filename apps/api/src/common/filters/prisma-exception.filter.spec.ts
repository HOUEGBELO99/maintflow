import { Prisma } from '@prisma/client';

import { PrismaExceptionFilter } from './prisma-exception.filter';

const prismaError = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('boom', { code, clientVersion: 'test', meta });

describe('PrismaExceptionFilter.map', () => {
  it('maps a unique violation to 409 and hides the tenant column', () => {
    const mapped = PrismaExceptionFilter.map(prismaError('P2002', { target: ['siteId', 'code'] }));
    expect(mapped).toMatchObject({ status: 409 });
    expect(mapped?.message).toContain('code');
    expect(mapped?.message).not.toContain('siteId');
  });

  it('maps a missing record to 404 and a broken relation to 400', () => {
    expect(PrismaExceptionFilter.map(prismaError('P2025'))?.status).toBe(404);
    expect(PrismaExceptionFilter.map(prismaError('P2003'))?.status).toBe(400);
  });

  it('leaves unknown codes to the default handler', () => {
    expect(PrismaExceptionFilter.map(prismaError('P1001'))).toBeNull();
  });
});
