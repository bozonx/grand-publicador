import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PublicationsService } from '../publications/publications.service.js';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import {
    CreateExternalPublicationDto,
    SchedulePublicationDto,
} from './dto/external.dto.js';

/**
 * External API controller for n8n and other automation tools
 * Protected by API key authentication
 */
@Controller('external')
@UseGuards(ApiKeyGuard)
export class ExternalController {
    constructor(private publicationsService: PublicationsService) { }

    /**
     * Create a publication from external source
     */
    @Post('publications')
    async createPublication(@Body() dto: CreateExternalPublicationDto) {
        return this.publicationsService.createExternal({
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
        return this.publicationsService.createPostsFromPublicationExternal(
            dto.publicationId,
            dto.channelIds,
            dto.scheduledAt,
        );
    }
}
