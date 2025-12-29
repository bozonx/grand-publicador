import {
    Controller,
    Post,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { PublicationsService } from '../publications/publications.service.js';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import {
    CreateExternalPublicationDto,
    SchedulePublicationDto,
} from './dto/external.dto.js';

/**
 * External API for n8n and other automation tools
 * Protected by API key authentication
 */
@Controller('external/v1')
@UseGuards(ApiKeyGuard)
export class ExternalController {
    constructor(private readonly publicationsService: PublicationsService) { }

    /**
     * Create a new publication from external source
     * POST /api/external/v1/publications
     */
    @Post('publications')
    async createPublication(@Body() dto: CreateExternalPublicationDto) {
        // For external API, we don't have userId, so we use null
        // The publication will be created without an author
        return this.publicationsService.create(null as any, {
            projectId: dto.projectId,
            title: dto.title,
            content: dto.content,
            mediaFiles: dto.mediaFiles,
            tags: dto.tags,
            status: dto.status,
        });
    }

    /**
     * Schedule publication to channels
     * POST /api/external/v1/publications/:id/schedule
     */
    @Post('publications/:id/schedule')
    async schedulePublication(
        @Param('id') id: string,
        @Body() dto: SchedulePublicationDto,
    ) {
        // For external API, we don't have userId, so we use null
        return this.publicationsService.createPostsFromPublication(
            id,
            null as any,
            dto.channelIds,
            dto.scheduledAt,
        );
    }
}
