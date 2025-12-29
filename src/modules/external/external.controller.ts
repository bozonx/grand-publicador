import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PublicationsService } from '../publications/publications.service.js';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import { CreateExternalPublicationDto, SchedulePublicationDto } from './dto/external.dto.js';

/**
 * External API controller for third-party integrations (e.g., n8n, Zapier).
 * protected by API key authentication mechanisms ensuring secure access.
 */
@Controller('external')
@UseGuards(ApiKeyGuard)
export class ExternalController {
  constructor(private publicationsService: PublicationsService) {}

  /**
   * Create a publication from external source
   */
  @Post('publications')
  async createPublication(@Body() dto: CreateExternalPublicationDto) {
    return this.publicationsService.create({
      projectId: dto.projectId,
      title: dto.title,
      content: dto.content,
      mediaFiles: dto.mediaFiles,
      tags: dto.tags,
      status: dto.status,
    });
  }

  /**
   * Schedule a publication to be posted to channels
   */
  @Post('publications/schedule')
  async schedulePublication(@Body() dto: SchedulePublicationDto) {
    return this.publicationsService.createPostsFromPublication(
      dto.publicationId,
      dto.channelIds,
      undefined, // No userId for external calls
      dto.scheduledAt,
    );
  }
}
