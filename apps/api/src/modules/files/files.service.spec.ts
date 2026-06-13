import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { FilesService, type UploadedFileLike } from './files.service';
import { StorageService } from './storage.service';

const image = (overrides: Partial<UploadedFileLike> = {}): UploadedFileLike => ({
  buffer: Buffer.from('x'),
  mimetype: 'image/jpeg',
  originalname: 'photo.jpg',
  size: 1024,
  ...overrides,
});

describe('FilesService', () => {
  let service: FilesService;
  const prisma = {
    fault: { findFirst: jest.fn() },
    intervention: { findFirst: jest.fn() },
    attachment: {
      create: jest.fn() as jest.Mock<Promise<unknown>, [{ data: Record<string, unknown> }]>,
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const storage = {
    upload: jest.fn(),
    signedUrl: jest.fn().mockResolvedValue('https://signed/url'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    storage.signedUrl.mockResolvedValue('https://signed/url');
    const moduleRef = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();
    service = moduleRef.get(FilesService);
  });

  it('uploads a fault photo, scopes by site, and records the attachment', async () => {
    prisma.fault.findFirst.mockResolvedValue({ id: 'f-1' });
    prisma.attachment.create.mockResolvedValue({
      id: 'a-1',
      storagePath: 'site-1/faults/f-1/uuid-photo.jpg',
      kind: 'photo',
      mimeType: 'image/jpeg',
    });

    const res = await service.attachToFault('site-1', 'f-1', image());

    expect(prisma.fault.findFirst).toHaveBeenCalledWith({
      where: { id: 'f-1', siteId: 'site-1' },
      select: { id: true },
    });
    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^site-1\/faults\/f-1\//),
      expect.anything(),
      'image/jpeg',
    );
    const created = prisma.attachment.create.mock.calls[0]![0].data;
    expect(created.kind).toBe('photo');
    expect(created.faultId).toBe('f-1');
    expect(res.url).toBe('https://signed/url');
  });

  it('refuses to attach to a fault outside the tenant', async () => {
    prisma.fault.findFirst.mockResolvedValue(null);
    await expect(service.attachToFault('site-1', 'foreign', image())).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(storage.upload).not.toHaveBeenCalled();
    expect(prisma.attachment.create).not.toHaveBeenCalled();
  });

  it('rejects non-image uploads', async () => {
    await expect(
      service.attachToFault('site-1', 'f-1', image({ mimetype: 'application/pdf' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.fault.findFirst).not.toHaveBeenCalled();
  });

  it('rejects files over the size limit', async () => {
    await expect(
      service.attachToFault('site-1', 'f-1', image({ size: 11 * 1024 * 1024 })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists a fault’s attachments with signed URLs, scoped by site', async () => {
    prisma.fault.findFirst.mockResolvedValue({ id: 'f-1' });
    prisma.attachment.findMany.mockResolvedValue([
      { id: 'a-1', storagePath: 'site-1/faults/f-1/x', kind: 'photo', mimeType: 'image/jpeg' },
    ]);

    const res = await service.listForFault('site-1', 'f-1');

    expect(prisma.attachment.findMany).toHaveBeenCalledWith({
      where: { faultId: 'f-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(res).toEqual([
      expect.objectContaining({ id: 'a-1', url: 'https://signed/url' }),
    ]);
  });

  it('refuses to list attachments for a fault outside the tenant', async () => {
    prisma.fault.findFirst.mockResolvedValue(null);
    await expect(service.listForFault('site-1', 'foreign')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.attachment.findMany).not.toHaveBeenCalled();
  });

  it('signs a URL only for an attachment in the caller’s site', async () => {
    prisma.attachment.findUnique.mockResolvedValue({
      id: 'a-1',
      storagePath: 'site-2/faults/f/obj',
      fault: { siteId: 'site-2' },
      intervention: null,
    });
    await expect(service.signedUrl('site-1', 'a-1')).rejects.toBeInstanceOf(NotFoundException);

    prisma.attachment.findUnique.mockResolvedValue({
      id: 'a-1',
      storagePath: 'site-1/faults/f/obj',
      fault: { siteId: 'site-1' },
      intervention: null,
    });
    await expect(service.signedUrl('site-1', 'a-1')).resolves.toEqual({
      url: 'https://signed/url',
    });
  });
});
