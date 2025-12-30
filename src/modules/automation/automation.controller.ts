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
  Request,
} from '@nestjs/common';
import { ApiTokenGuard } from '../../common/guards/api-key.guard.js';
import { AutomationService } from './automation.service.js';
import { UpdatePostStatusDto } from './dto/automation.dto.js';

/**
 * Automation API for polling and updating scheduled posts.
 * Designed for use by the background worker service.
 * Protected by API token authentication.
 */
@Controller('automation/v1')
@UseGuards(ApiTokenGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) { }

  /**
   * Get posts that are ready to be published
   * GET /api/automation/v1/posts/pending?limit=10
   * Only returns posts from projects within the token's scope
   */
  @Get('posts/pending')
  async getPendingPosts(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('lookback', new DefaultValuePipe(60), ParseIntPipe) lookback: number,
  ) {
    const { userId, scopeProjectIds } = req.user;
    return this.automationService.getPendingPosts(limit, lookback, userId, scopeProjectIds);
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
  async updatePostStatus(@Param('id') id: string, @Body() dto: UpdatePostStatusDto) {
    return this.automationService.updatePostStatus(id, dto.status, dto.error);
  }
}
