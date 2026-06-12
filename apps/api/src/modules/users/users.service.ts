import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/** Read-only user directory for the current tenant (used for assignment UIs). */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(siteId: string) {
    return this.prisma.user.findMany({
      where: { siteId },
      select: { id: true, name: true, email: true, role: true, workshop: true, status: true, initials: true, color: true },
      orderBy: { name: 'asc' },
    });
  }
}
