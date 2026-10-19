import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

/**
 * Maps known Prisma errors to meaningful HTTP responses instead of a bare 500:
 *  - P2002 unique constraint  → 409 Conflict (e.g. machine code already used)
 *  - P2025 record not found   → 404 Not Found
 *  - P2003 foreign key failed → 400 Bad Request
 * Anything else falls through to Nest's default handling.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  override catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const mapped = PrismaExceptionFilter.map(exception);
    if (!mapped) return super.catch(exception, host);

    host
      .switchToHttp()
      .getResponse<{ status(code: number): { json(body: unknown): void } }>()
      .status(mapped.status)
      .json({ statusCode: mapped.status, message: mapped.message, error: mapped.error });
  }

  static map(
    e: Prisma.PrismaClientKnownRequestError,
  ): { status: number; message: string; error: string } | null {
    switch (e.code) {
      case 'P2002': {
        const target = e.meta?.target;
        const fields = Array.isArray(target) ? target.filter((f) => f !== 'siteId') : [];
        const label = fields.length ? ` (${fields.join(', ')})` : '';
        return {
          status: HttpStatus.CONFLICT,
          message: `Cette valeur est déjà utilisée${label}.`,
          error: 'Conflict',
        };
      }
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Ressource introuvable.', error: 'Not Found' };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Référence invalide vers une ressource liée.',
          error: 'Bad Request',
        };
      default:
        return null;
    }
  }
}
