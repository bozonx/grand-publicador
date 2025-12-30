import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PublicationsService } from '../publications/publications.service.js';
import { ApiTokenGuard } from '../../common/guards/api-key.guard.js';
import { CreateExternalPublicationDto, SchedulePublicationDto } from './dto/external.dto.js';

/**
 * External API controller for third-party integrations (e.g., n8n, Zapier).
 * Protected by API token authentication.
 */
@Controller('external')
@UseGuards(ApiTokenGuard)
export class ExternalController {
  constructor(private publicationsService: PublicationsService) { }

  /**
   * Create a publication from external source
   */
  @Post('publications')
  async createPublication(@Request() req: any, @Body() dto: CreateExternalPublicationDto) {
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
  async schedulePublication(@Request() req: any, @Body() dto: SchedulePublicationDto) {
    const { userId } = req.user;

    return this.publicationsService.createPostsFromPublication(
      dto.publicationId,
      dto.channelIds,
      userId, // Use userId from token
      dto.scheduledAt,
    );
  }
}
