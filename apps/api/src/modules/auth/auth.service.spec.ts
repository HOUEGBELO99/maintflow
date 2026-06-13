import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = { user: { findUnique: jest.fn() } };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn(), getOrThrow: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('getProfile returns the application profile by id', async () => {
    const profile = {
      id: 'u-1',
      email: 's@maintflow.io',
      name: 'Sophie Diallo',
      role: 'technicien',
      siteId: 'site-1',
    };
    prisma.user.findUnique.mockResolvedValue(profile);

    await expect(service.getProfile('u-1')).resolves.toEqual(profile);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      select: { id: true, email: true, name: true, role: true, siteId: true },
    });
  });

  it('getProfile throws when the user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile('ghost')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
