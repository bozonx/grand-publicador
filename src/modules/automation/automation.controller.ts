import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import { AutomationService } from './automation.service.js';
import { UpdatePostStatusDto } from './dto/automation.dto.js';

/**
 * Automation API for scheduled publishing
 * Protected by API key authentication
 */
@Controller('automation/v1')
@UseGuards(ApiKeyGuard)
export class AutomationController {
    constructor(private readonly automationService: AutomationService) { }

    /**
     * Get posts that are ready to be published
     * GET /api/automation/v1/posts/pending?limit=10
     */
    @Get('posts/pending')
    async getPendingPosts(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('lookback', new DefaultValuePipe(60), ParseIntPipe) lookback: number,
    ) {
        return this.automationService.getPendingPosts(limit, lookback);
    }

    /**
     * Claim a post for publishing (atomic operation)
     * POST /api/automation/v1/posts/:id/claim
     */
    @Post('posts/:id/claim')
    async claimPost(@Param('id') id: string) {
        return this.automationService.claimPost(id);
    }

    /**
     * Update post status after publishing
     * PATCH /api/automation/v1/posts/:id/status
     */
    @Patch('posts/:id/status')
    async updatePostStatus(
        @Param('id') id: string,
        @Body() dto: UpdatePostStatusDto,
    ) {
        return this.automationService.updatePostStatus(
            id,
            dto.status,
            dto.error,
        );
    }
}
