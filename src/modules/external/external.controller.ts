import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';

import { ApiTokenGuard } from '../../common/guards/api-token.guard.js';
import type { ApiTokenRequest } from '../../common/types/api-token-user.interface.js';
import { PublicationsService } from '../publications/publications.service.js';
import { CreateExternalPublicationDto, SchedulePublicationDto } from './dto/external.dto.js';

/**
 * External API controller for third-party integrations (e.g., n8n, Zapier).
 * Protected by API token authentication.
 */
@Controller('external')
@UseGuards(ApiTokenGuard)
export class ExternalController {
  constructor(private publicationsService: PublicationsService) {}

  /**
   * Create a publication from external source
   */
  @Post('publications')
  public async createPublication(
    @Request() req: ApiTokenRequest,
    @Body() dto: CreateExternalPublicationDto,
  ) {
    const { userId, scopeProjectIds } = req.user;

    // Validate project scope
    ApiTokenGuard.validateProjectScope(dto.projectId, scopeProjectIds);

    return this.publicationsService.create({
      projectId: dto.projectId,
      title: dto.title,
      content: dto.content,
      mediaFiles: dto.mediaFiles,
      tags: dto.tags,
      status: dto.status,
      authorId: userId, // Set author from token
    });
  }

  /**
   * Schedule a publication to be posted to channels
   */
  @Post('publications/schedule')
  public async schedulePublication(
    @Request() req: ApiTokenRequest,
    @Body() dto: SchedulePublicationDto,
  ) {
    const { userId } = req.user;

    return this.publicationsService.createPostsFromPublication(
      dto.publicationId,
      dto.channelIds,
      userId, // Use userId from token
      dto.scheduledAt,
    );
  }
}
