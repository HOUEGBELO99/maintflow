import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { DEMO_SITE_ID, seedDemoData, type SeedCounts } from '../../database/seed-demo';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Drops the demo tenant (cascade) and re-applies the canonical seed, returning
   * to the prototype's example dataset. Dev-only (guarded in the controller).
   */
  async resetDemo(): Promise<SeedCounts> {
    await this.prisma.site.deleteMany({ where: { id: DEMO_SITE_ID } });
    return seedDemoData(this.prisma);
  }
}
