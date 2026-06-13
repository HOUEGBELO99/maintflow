import { randomUUID } from 'node:crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';

/** Minimal shape of a Multer upload (avoids depending on @types/multer). */
export interface UploadedFileLike {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface AttachmentResult {
  id: string;
  storagePath: string;
  kind: string;
  mimeType: string;
  url: string;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Uploads photos/documents to Supabase Storage and records them as
 * Attachments, scoped to the caller's site. Storage paths are never public —
 * clients fetch a short-lived signed URL.
 */
@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async attachToFault(
    siteId: string,
    faultId: string,
    file: UploadedFileLike,
  ): Promise<AttachmentResult> {
    this.assertImage(file);
    const fault = await this.prisma.fault.findFirst({
      where: { id: faultId, siteId },
      select: { id: true },
    });
    if (!fault) throw new NotFoundException('Fault not found');

    const path = this.buildPath(siteId, 'faults', faultId, file.originalname);
    await this.storage.upload(path, file.buffer, file.mimetype);
    const attachment = await this.prisma.attachment.create({
      data: { storagePath: path, kind: 'photo', mimeType: file.mimetype, faultId },
    });
    return this.withSignedUrl(attachment);
  }

  async attachToIntervention(
    siteId: string,
    interventionId: string,
    file: UploadedFileLike,
  ): Promise<AttachmentResult> {
    this.assertImage(file);
    const intervention = await this.prisma.intervention.findFirst({
      where: { id: interventionId, siteId },
      select: { id: true },
    });
    if (!intervention) throw new NotFoundException('Intervention not found');

    const path = this.buildPath(siteId, 'interventions', interventionId, file.originalname);
    await this.storage.upload(path, file.buffer, file.mimetype);
    const attachment = await this.prisma.attachment.create({
      data: {
        storagePath: path,
        kind: 'photo',
        mimeType: file.mimetype,
        interventionId,
      },
    });
    return this.withSignedUrl(attachment);
  }

  async listForFault(siteId: string, faultId: string): Promise<AttachmentResult[]> {
    const fault = await this.prisma.fault.findFirst({
      where: { id: faultId, siteId },
      select: { id: true },
    });
    if (!fault) throw new NotFoundException('Fault not found');
    const rows = await this.prisma.attachment.findMany({
      where: { faultId },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map((r) => this.withSignedUrl(r)));
  }

  async listForIntervention(
    siteId: string,
    interventionId: string,
  ): Promise<AttachmentResult[]> {
    const intervention = await this.prisma.intervention.findFirst({
      where: { id: interventionId, siteId },
      select: { id: true },
    });
    if (!intervention) throw new NotFoundException('Intervention not found');
    const rows = await this.prisma.attachment.findMany({
      where: { interventionId },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map((r) => this.withSignedUrl(r)));
  }

  async signedUrl(siteId: string, attachmentId: string): Promise<{ url: string }> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        fault: { select: { siteId: true } },
        intervention: { select: { siteId: true } },
      },
    });
    const ownerSite = attachment?.fault?.siteId ?? attachment?.intervention?.siteId;
    if (!attachment || ownerSite !== siteId) {
      throw new NotFoundException('Attachment not found');
    }
    return { url: await this.storage.signedUrl(attachment.storagePath) };
  }

  private assertImage(file: UploadedFileLike | undefined): asserts file {
    if (!file) throw new BadRequestException('A file is required');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('File exceeds the 10 MB limit');
    }
  }

  /** `<siteId>/<scope>/<entityId>/<uuid>-<sanitized-name>` — opaque, collision-free. */
  private buildPath(siteId: string, scope: string, entityId: string, name: string): string {
    const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    return `${siteId}/${scope}/${entityId}/${randomUUID()}-${safe}`;
  }

  private async withSignedUrl(attachment: {
    id: string;
    storagePath: string;
    kind: string;
    mimeType: string;
  }): Promise<AttachmentResult> {
    return {
      id: attachment.id,
      storagePath: attachment.storagePath,
      kind: attachment.kind,
      mimeType: attachment.mimeType,
      url: await this.storage.signedUrl(attachment.storagePath),
    };
  }
}
